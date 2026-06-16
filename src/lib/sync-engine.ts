import { db } from '@/db/database';
import { getPending, removeBatch, pendingCount } from '@/lib/sync-queue';

export type SyncState = 'idle' | 'pushing' | 'pulling' | 'error';

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: string | null;
  pendingCount: number;
  online: boolean;
  error?: string;
}

type Listener = () => void;

const LAST_SYNC_KEY = 'pantry-last-sync';
const SEEDED_KEY = 'pantry-cloud-seeded';
// One-time recovery: the tenancy migration silently rejected every insert that
// lacked a tenant_id, and the old push API returned 200 anyway, so the device
// dropped those records from its outbox. Once the tenant-stamping fix is live,
// re-enqueue all local records once so the stranded rows (≈ everything since
// early May 2026) flow back up to Supabase. Bump the suffix to force again.
const RESEED_KEY = 'pantry-cloud-reseed-tenant-fix-1';

class SyncEngine {
  private status: SyncStatus = {
    state: 'idle',
    lastSyncAt: localStorage.getItem(LAST_SYNC_KEY),
    pendingCount: 0,
    online: navigator.onLine,
  };

  private listeners = new Set<Listener>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private syncing = false;

  constructor() {
    window.addEventListener('online', () => {
      this.status = { ...this.status, online: true };
      this.notify();
      this.sync().catch(() => {});
    });

    window.addEventListener('offline', () => {
      this.status = { ...this.status, online: false };
      this.notify();
    });

    // Initialize pending count
    pendingCount().then((count) => {
      this.status = { ...this.status, pendingCount: count };
      this.notify();
    });
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = localStorage.getItem('pantry-api-key');
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
  }

  /** Re-authenticate to obtain the API key if missing or expired */
  private async ensureApiKey(): Promise<void> {
    if (localStorage.getItem('pantry-api-key')) return;

    // Use the known password to get the API key from the server
    const authed = localStorage.getItem('pantry-auth');
    if (!authed) return; // Not logged in at all

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'stmark' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.apiKey) localStorage.setItem('pantry-api-key', data.apiKey);
      }
    } catch {
      // Offline — skip, will retry next sync
    }
  }

  async sync(): Promise<void> {
    if (this.syncing || !navigator.onLine) return;
    this.syncing = true;

    try {
      // Ensure we have an API key before syncing
      await this.ensureApiKey();

      // One-time initial seed: push all local data on first sync
      if (!localStorage.getItem(SEEDED_KEY)) {
        await this.seedInitialData();
        localStorage.setItem(SEEDED_KEY, '1');
      } else if (!localStorage.getItem(RESEED_KEY)) {
        // Already seeded on an older build → re-enqueue everything once so the
        // records stranded by the tenant_id bug get re-pushed (idempotent
        // upserts, so existing cloud rows are unaffected).
        await this.seedInitialData();
        localStorage.setItem(RESEED_KEY, '1');
      }

      await this.push();
      await this.pull();

      const count = await pendingCount();
      this.status = {
        ...this.status,
        state: 'idle',
        pendingCount: count,
        error: undefined,
      };
      this.notify();
    } catch (err) {
      const count = await pendingCount().catch(() => 0);
      this.status = {
        ...this.status,
        state: 'error',
        pendingCount: count,
        error: err instanceof Error ? err.message : 'Sync failed',
      };
      this.notify();
    } finally {
      this.syncing = false;
    }
  }

  // Keep each request well under the server's 500-mutation cap. A full
  // re-seed enqueues every local record at once, so the push must chunk.
  private static readonly PUSH_CHUNK = 200;

  private async push(): Promise<void> {
    const entries = await getPending();
    if (entries.length === 0) return;

    this.status = { ...this.status, state: 'pushing' };
    this.notify();

    // Deduplicate: for same table+id, keep the latest entry.
    // entries are pre-sorted by seqNo, so Map.set overwrites older writes
    // with newer ones. A trailing delete correctly wins over prior upserts;
    // a trailing upsert wins over a prior delete (re-created with same id).
    const deduped = new Map<string, typeof entries[0]>();
    for (const entry of entries) {
      const key = `${entry.tableName}:${entry.recordId}`;
      deduped.set(key, entry);
    }
    const unique = Array.from(deduped.values());

    // Track which table:id pairs actually landed, so we only clear those from
    // the outbox. Records the server rejected stay queued and retry next sync
    // (no more silent drops).
    const succeeded = new Set<string>();

    for (let i = 0; i < unique.length; i += SyncEngine.PUSH_CHUNK) {
      const slice = unique.slice(i, i + SyncEngine.PUSH_CHUNK);
      const mutations = slice.map((entry) => ({
        table: entry.tableName,
        id: entry.recordId,
        action: entry.action,
        payload: entry.payload,
      }));

      let res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ mutations }),
      });

      // If 401, re-authenticate and retry once
      if (res.status === 401) {
        localStorage.removeItem('pantry-api-key');
        await this.ensureApiKey();
        res = await fetch('/api/sync/push', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ mutations }),
        });
      }

      if (!res.ok) {
        throw new Error(`Push failed: ${res.status}`);
      }

      const body = (await res.json().catch(() => ({}))) as { failedIds?: string[] };
      const failedIds = new Set(body.failedIds ?? []);
      for (const entry of slice) {
        if (!failedIds.has(entry.recordId)) {
          succeeded.add(`${entry.tableName}:${entry.recordId}`);
        }
      }
    }

    // Remove every queue entry (including pre-dedup duplicates) whose record
    // landed. Failed records keep their entries and retry on the next sync.
    const seqNos = entries
      .filter((e) => succeeded.has(`${e.tableName}:${e.recordId}`))
      .map((e) => e.seqNo!)
      .filter(Boolean);
    if (seqNos.length > 0) {
      await removeBatch(seqNos);
    }
  }

  private async pull(): Promise<void> {
    this.status = { ...this.status, state: 'pulling' };
    this.notify();

    const since = this.status.lastSyncAt;
    const url = since
      ? `/api/sync/pull?since=${encodeURIComponent(since)}`
      : '/api/sync/pull';

    let res = await fetch(url, { headers: this.getHeaders() });

    // If 401, re-authenticate and retry once
    if (res.status === 401) {
      localStorage.removeItem('pantry-api-key');
      await this.ensureApiKey();
      res = await fetch(url, { headers: this.getHeaders() });
    }

    if (!res.ok) {
      throw new Error(`Pull failed: ${res.status}`);
    }

    const data = await res.json() as {
      ok: boolean;
      clients: Record<string, unknown>[];
      visits: Record<string, unknown>[];
      volunteers: Record<string, unknown>[];
      volunteerShifts: Record<string, unknown>[];
      volunteerSignups: Record<string, unknown>[];
      syncedAt: string;
    };

    if (!data.ok) throw new Error('Pull response not ok');

    // Apply remote changes directly to Dexie (bypass hooks → no re-enqueue)
    await this.applyRemoteChanges('clients', data.clients, db.clients);
    await this.applyRemoteChanges('visits', data.visits, db.visits);
    await this.applyRemoteChanges('volunteers', data.volunteers, db.volunteers);
    await this.applyRemoteChanges('volunteerShifts', data.volunteerShifts, db.volunteerShifts);
    await this.applyRemoteChanges('volunteerSignups', data.volunteerSignups, db.volunteerSignups);

    this.status = { ...this.status, lastSyncAt: data.syncedAt };
    localStorage.setItem(LAST_SYNC_KEY, data.syncedAt);
  }

  private async applyRemoteChanges(
    _tableName: string,
    records: Record<string, unknown>[],
    table: import('dexie').Table
  ): Promise<void> {
    if (!records || records.length === 0) return;

    for (const record of records) {
      const id = record.id as string;
      if (!id) continue;

      // Soft-deleted remotely → delete locally
      if (record.deletedAt) {
        await table.delete(id).catch(() => {});

        // For clients, also cascade-delete visits and enqueue the deletions
        if (_tableName === 'clients') {
          const orphanedVisits = await db.visits.where('clientId').equals(id).toArray().catch(() => []);
          for (const visit of orphanedVisits) {
            const { enqueue } = await import('@/lib/sync-queue');
            await enqueue('visits', visit.id, 'delete');
          }
          await db.visits.where('clientId').equals(id).delete().catch(() => {});
        }
        continue;
      }

      // Remove the deletedAt field before storing locally
      const { deletedAt: _, ...cleanRecord } = record;

      // Ensure array fields are never null/undefined (prevents .includes/.map crashes)
      for (const key of ['recurringDays', 'recurringSlots', 'familyMembers']) {
        if (key in cleanRecord && !Array.isArray(cleanRecord[key])) {
          cleanRecord[key] = [];
        }
      }

      // Convert legacy {age} family members from stale cloud rows to the
      // DOB-based shape (mirrors the v7 Dexie migration; deterministic).
      if (_tableName === 'clients' && Array.isArray(cleanRecord.familyMembers)) {
        const { normalizeFamilyMember, recordYear } = await import('@/lib/family');
        const asOfYear = recordYear(cleanRecord as { createdAt?: string; updatedAt?: string });
        cleanRecord.familyMembers = (cleanRecord.familyMembers as Record<string, unknown>[]).map(
          (m) => normalizeFamilyMember(m, asOfYear),
        );
      }

      // Last-write-wins: only apply if remote is strictly newer.
      // Parse as Date to avoid string-compare surprises when clocks differ
      // in offset formatting (e.g. "+00:00" vs "Z"). On tie, server wins.
      const local = await table.get(id);
      if (local) {
        const localUpdated = (local as Record<string, unknown>).updatedAt as string | undefined;
        const remoteUpdated = cleanRecord.updatedAt as string | undefined;
        const localMs = localUpdated ? Date.parse(localUpdated) : NaN;
        const remoteMs = remoteUpdated ? Date.parse(remoteUpdated) : NaN;

        if (!Number.isNaN(localMs) && !Number.isNaN(remoteMs) && localMs > remoteMs) {
          continue; // Local is strictly newer, skip
        }
      }

      // Direct put — bypasses hooks so no re-enqueue
      await table.put(cleanRecord);
    }
  }

  private async seedInitialData(): Promise<void> {
    const { enqueue } = await import('@/lib/sync-queue');

    const clients = await db.clients.toArray();
    for (const client of clients) {
      await enqueue('clients', client.id, 'upsert', client as unknown as Record<string, unknown>);
    }

    const visits = await db.visits.toArray();
    for (const visit of visits) {
      await enqueue('visits', visit.id, 'upsert', visit as unknown as Record<string, unknown>);
    }

    const volunteers = await db.volunteers.toArray();
    for (const vol of volunteers) {
      await enqueue('volunteers', vol.id, 'upsert', vol as unknown as Record<string, unknown>);
    }

    const shifts = await db.volunteerShifts.toArray();
    for (const shift of shifts) {
      await enqueue('volunteerShifts', shift.id, 'upsert', shift as unknown as Record<string, unknown>);
    }

    const signups = await db.volunteerSignups.toArray();
    for (const signup of signups) {
      await enqueue('volunteerSignups', signup.id, 'upsert', signup as unknown as Record<string, unknown>);
    }
  }

  startPolling(intervalMs: number = 30_000): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.sync().catch(() => {});
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /** Force a full re-sync by clearing the lastSyncAt timestamp */
  resetLastSync(): void {
    localStorage.removeItem(LAST_SYNC_KEY);
    this.status = { ...this.status, lastSyncAt: null };
    this.notify();
  }
}

export const syncEngine = new SyncEngine();

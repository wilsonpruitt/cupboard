import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../lib/supabase.js';
import { requireAuth } from '../lib/require-auth.js';
import { getSupabaseTable, toDB } from '../lib/field-map.js';

interface Mutation {
  table: string;
  id: string;
  action: 'upsert' | 'delete';
  payload?: Record<string, unknown>;
}

// St. Mark = tenant zero. The device's sync payloads predate multi-tenancy and
// never send tenant_id, but the tenancy migration made tenant_id NOT NULL on
// every domain table — so un-stamped inserts were silently rejected. Stamp it
// here (single-tenant for now; override per-deployment via DEFAULT_TENANT_ID).
const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID?.trim() || '04b7516b-5672-4bab-95d0-2ac00974132c';

// Tables whose tenant_id column is NOT NULL and must be stamped on insert.
const TENANT_SCOPED = new Set([
  'pantry_clients',
  'pantry_visits',
  'pantry_volunteer_shifts',
  'volunteers',
  'signups',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;

  try {
    const { mutations } = req.body as { mutations: Mutation[] };

    if (!Array.isArray(mutations) || mutations.length === 0) {
      return res.status(400).json({ error: 'mutations array required' });
    }

    if (mutations.length > 500) {
      return res.status(400).json({ error: 'Max 500 mutations per request' });
    }

    const supabase = getSupabase();
    let processed = 0;
    let failed = 0;
    // ids the device must KEEP queued because they did not land (retry next sync).
    // Prevents the old bug where a rejected batch still returned 200 and the
    // device dropped the records from its outbox → silent data loss.
    const failedIds: string[] = [];

    // Group mutations by table for batch operations
    const grouped: Record<string, { upserts: Record<string, unknown>[]; deletes: string[] }> = {};

    for (const mut of mutations) {
      const supaTable = getSupabaseTable(mut.table);
      if (!grouped[supaTable]) {
        grouped[supaTable] = { upserts: [], deletes: [] };
      }

      if (mut.action === 'delete') {
        grouped[supaTable].deletes.push(mut.id);
      } else if (mut.payload) {
        const dbRecord = toDB(mut.table, mut.payload);
        if (TENANT_SCOPED.has(supaTable) && dbRecord.tenant_id == null) {
          dbRecord.tenant_id = DEFAULT_TENANT_ID;
        }
        grouped[supaTable].upserts.push(dbRecord);
      }
    }

    for (const [supaTable, { upserts, deletes }] of Object.entries(grouped)) {
      // Process upserts in batches of 50
      for (let i = 0; i < upserts.length; i += 50) {
        const batch = upserts.slice(i, i + 50);
        const { error } = await supabase
          .from(supaTable)
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          console.error(`Push upsert error (${supaTable}):`, error);
          failed += batch.length;
          for (const row of batch) {
            if (typeof row.id === 'string') failedIds.push(row.id);
          }
        } else {
          processed += batch.length;
        }
      }

      // Process soft-deletes
      if (deletes.length > 0) {
        const { error } = await supabase
          .from(supaTable)
          .update({ deleted_at: new Date().toISOString() })
          .in('id', deletes);

        if (error) {
          console.error(`Push delete error (${supaTable}):`, error);
          failed += deletes.length;
          failedIds.push(...deletes);
        } else {
          processed += deletes.length;
        }
      }
    }

    return res.status(200).json({ ok: failed === 0, processed, failed, failedIds });
  } catch (err) {
    console.error('Push sync error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

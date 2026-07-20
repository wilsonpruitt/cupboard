// St. Mark = tenant zero. Every domain table got tenant_id NOT NULL in the
// 2026-05-18 tenancy migration, so every insert MUST stamp it — an un-stamped
// insert is rejected (Postgres 23502) and, if the caller ignores the error,
// silently drops the record. These endpoints are single-tenant for now; override
// per-deployment via DEFAULT_TENANT_ID. Real multi-tenant resolution
// (host/auth → tenant) is future work — see audit T3.
export const DEFAULT_TENANT_ID =
  process.env.DEFAULT_TENANT_ID?.trim() || '04b7516b-5672-4bab-95d0-2ac00974132c';

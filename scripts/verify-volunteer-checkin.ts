#!/usr/bin/env npx tsx
// One-time live verification of the volunteer QR check-in path (self-cleaning).
// POSTs a diagnostic check-in to the DEPLOYED public endpoint, confirms the
// resulting row landed in Supabase with the correct tenant_id, then deletes it.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/verify-volunteer-checkin.ts
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (from .env.local)

import { createClient } from '@supabase/supabase-js';

const DEPLOYED_URL = 'https://st-mark-pantry.vercel.app';
const ST_MARK_TENANT_ID = '04b7516b-5672-4bab-95d0-2ac00974132c';

const PANTRY_DAY_NAMES: Record<number, string> = { 1: 'Monday', 5: 'Friday', 6: 'Saturday' };

function todayInfo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { date: `${y}-${m}-${day}`, dayOfWeek: PANTRY_DAY_NAMES[d.getDay()] ?? 'Monday' };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY — run with --env-file=.env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const diagFirstName = 'Diagnostic';
  const diagLastName = `Test-${Date.now()}`;
  const { date, dayOfWeek } = todayInfo();

  console.log(`Posting diagnostic check-in for "${diagFirstName} ${diagLastName}" (${date}, ${dayOfWeek})...`);

  const res = await fetch(`${DEPLOYED_URL}/api/public/volunteer-checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: diagFirstName, lastName: diagLastName, date, dayOfWeek }),
  });
  const body = await res.json();
  console.log('Response:', res.status, body);

  if (!res.ok || !body.ok) {
    console.error('FAIL: endpoint did not return ok — nothing to clean up, stopping.');
    process.exit(1);
  }

  // Find the volunteer we just created
  const { data: volunteers, error: volErr } = await supabase
    .from('volunteers')
    .select('id, tenant_id, first_name, last_name')
    .eq('first_name', diagFirstName)
    .eq('last_name', diagLastName)
    .limit(1);

  if (volErr || !volunteers || volunteers.length === 0) {
    console.error('FAIL: could not find the diagnostic volunteer row in Supabase.', volErr);
    process.exit(1);
  }
  const volunteer = volunteers[0];
  console.log('Found volunteer row:', volunteer);

  if (volunteer.tenant_id !== ST_MARK_TENANT_ID) {
    console.error(`FAIL: tenant_id mismatch — expected ${ST_MARK_TENANT_ID}, got ${volunteer.tenant_id}`);
    process.exit(1);
  }

  // Find the shift row
  const { data: shifts, error: shiftErr } = await supabase
    .from('pantry_volunteer_shifts')
    .select('id, tenant_id, volunteer_id, date, day_of_week')
    .eq('volunteer_id', volunteer.id)
    .eq('date', date)
    .limit(1);

  if (shiftErr || !shifts || shifts.length === 0) {
    console.error('FAIL: could not find the diagnostic shift row in Supabase.', shiftErr);
    process.exit(1);
  }
  const shift = shifts[0];
  console.log('Found shift row:', shift);

  if (shift.tenant_id !== ST_MARK_TENANT_ID) {
    console.error(`FAIL: shift tenant_id mismatch — expected ${ST_MARK_TENANT_ID}, got ${shift.tenant_id}`);
    process.exit(1);
  }

  console.log('PASS: check-in landed correctly with tenant_id stamped on both rows.');

  // Idempotency check: POST the same check-in again, expect alreadyCheckedIn: true, no new row
  console.log('\nVerifying idempotency (re-posting same check-in)...');
  const res2 = await fetch(`${DEPLOYED_URL}/api/public/volunteer-checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volunteerId: volunteer.id, date, dayOfWeek }),
  });
  const body2 = await res2.json();
  console.log('Response:', res2.status, body2);
  if (!res2.ok || !body2.ok) {
    console.error('WARNING: re-post did not return ok.');
  } else if (body2.alreadyCheckedIn !== true) {
    console.error('WARNING: expected alreadyCheckedIn:true on re-post, got', body2.alreadyCheckedIn);
  } else {
    console.log('PASS: idempotent — no duplicate shift created.');
  }

  const { data: shiftsAfter } = await supabase
    .from('pantry_volunteer_shifts')
    .select('id')
    .eq('volunteer_id', volunteer.id)
    .eq('date', date);
  console.log(`Shift row count for this volunteer+date: ${shiftsAfter?.length ?? '?'} (expect 1)`);

  // Clean up — delete diagnostic rows
  console.log('\nCleaning up diagnostic rows...');
  await supabase.from('pantry_volunteer_shifts').delete().eq('volunteer_id', volunteer.id);
  await supabase.from('volunteers').delete().eq('id', volunteer.id);
  console.log('Deleted diagnostic volunteer + shift row(s). Done.');
}

main().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});

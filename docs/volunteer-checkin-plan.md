# Volunteer QR Check-In — build plan

> **SUPERSEDED 2026-07-20.** The feature shipped the same day this plan was written (commits
> `a5e27c9`, `864b5f8`, `dcdaf32`), built fresh from a live conversation with Wilson rather than
> from this doc — this handoff was never consulted mid-build. Live-verified against the real
> deployed endpoint (`scripts/verify-volunteer-checkin.ts`): a diagnostic check-in landed with the
> correct `tenant_id` on both `volunteers` and `pantry_volunteer_shifts`, a re-post correctly
> no-opped as `alreadyCheckedIn`, and the diagnostic rows were deleted after confirming. What
> shipped differs from the plan below in three ways, kept intentionally rather than reconciled:
> - **Routing:** a standalone static page `public/site/volunteer-checkin.html` (same `/site/*`
>   passthrough as the existing volunteer sign-up page), not a `/checkin` path routed through
>   `main.tsx`.
> - **Search scope:** free-text name search across *all* volunteers (first+last), not tap-chips
>   limited to *today's already-signed-up* roster. Chosen deliberately — it also covers walk-ins
>   and irregulars who never pre-signed-up, which the roster-only design couldn't.
> - **Timezone:** trusts the phone's local clock rather than forcing America/Chicago. Equivalent
>   in practice since the phone is physically at the pantry, but not the same hard guarantee.
>
> See `cupboard-product.md` memory (topic file, not this doc) for the live status. The plan below
> is kept for historical context only — do not build against it.

> **BUILD-READY HANDOFF (for a Sonnet session).** Scope, data model, and decisions are all settled
> below — nothing left to design. Build the 6 steps in order, then run the verification checklist at
> the bottom. Use the **`wroot-labs-design`** skill for Fen & Ink styling. Don't re-open the locked
> decisions; if you hit a genuine ambiguity not covered here, note it and pick the simplest option.

**Status:** planned 2026-07-20, not built. St. Mark-only value; does NOT depend on audit T3.
**Driver:** *rigor.* Signup/attendance data was inconsistent because it lived on the offline
Chromebook and got lost to its fragility. Fix = capture on the volunteer's own phone, write
**straight to Supabase (cloud-first)**, and let the existing sync *pull* it down to the Chromebook.
The offline client-serving path is untouched — this is volunteer attendance only ("just attendance data").

## Why this is mostly assembly, not invention
- **`VolunteerShift`** (`pantry_volunteer_shifts` table, `src/types/index.ts:85`) already models
  "this volunteer was here on this date." A check-in creates one.
- **Sync already pulls `volunteerShifts`** cloud→device (`src/lib/sync-engine.ts:261`). A phone
  check-in lands in Chromebook reports automatically — no new sync plumbing.
- **`api/public/signup.ts`** (just fixed) is the exact template for a public, tenant-stamped write.

## Two captures (this build = #2 ONLY)
1. **Signup (advance, "put my name down")** — already works via `api/public/signup.ts` → `signups`
   table. **Out of scope for this build; leave it alone.**
2. **Check-in (day-of, "I'm here now")** — THE thing being built → `pantry_volunteer_shifts` table.
   Reports can then compare signed-up vs. actually-present — the consistency that was missing.

## Flow (check-in ONLY — do not add a "sign up for future dates" path)
One **static, laminated QR** at the sign-in table (printed once — never per-day) → opens
`stmarklegacy.org/checkin` (public, pre-gate) → volunteer taps their name from today's roster
**or** types name (+ optional email) → one tap → on-screen "You're checked in, thanks!". No email
required for day-of. No Chromebook.

## Decisions locked (do not re-open)
- **Scope: check-in only.** No advance-signup path on this page.
- **UI: build clean in Fen & Ink** via the `wroot-labs-design` skill. Do NOT model on Circuit —
  build our own; keep it lean.
- **Cloud-first**, decoupled from Chromebook/Dexie (the rigor point).
- **Identity:** roster quick-tap + name/optional-email entry. No personal QR badges in v1.
- **Anti-abuse:** honeypot + idempotent dedup only. Daily PIN deferred until/unless junk appears.
- **Idempotent:** re-scanning is harmless — dedup a shift by `volunteerId + date`.
- **"Today" computed in America/Chicago, NOT UTC** — avoid the UTC-midnight attendance-date bug
  (cf. `reference_circuit-attendance-event-midnight-utc`).

## Build steps
1. **`api/public/volunteer-checkin.ts`** — clone `api/public/signup.ts`. POST `{firstName, lastName,
   email?, phone?, role?}`. Upsert volunteer (by email if given, else exact-name match / create).
   Create `pantry_volunteer_shifts` row for today (Central tz), `role?`. Stamp `tenant_id`
   (`DEFAULT_TENANT_ID` from `api/_lib/tenant.js`). **Check the Supabase error** and return 500 on
   failure — never a false 200 (the T1/T2 lesson). Dedup by `volunteer_id + date` → return ok, no dup.
2. **`/checkin` public page** — route by pathname in `main.tsx` (same bypass mechanism the Startup
   Guide uses). Fen & Ink styling. Big tap targets (phone, glove-friendly).
3. **Roster quick-tap (optional but recommended)** — small public GET returning **today's signed-up
   volunteer first names only** (tenant-scoped, no email/phone — privacy) to render tap-chips.
4. **Static QR asset** — generated once pointing at the check-in URL; Wilson prints + laminates.
5. **Confirmation UX** — on-screen only; no confirmation email for check-in.
6. **Verify** — real phone check-in → row in Supabase with `tenant_id` → appears in Chromebook
   reports after a sync (pull path already handles `volunteerShifts`).

## Tenancy / scope notes
- New public write path → tenant-stamped from day one. When T3 (host→tenant resolution) lands,
  swap `DEFAULT_TENANT_ID` for host-derived tenant. Single-tenant is correct for St. Mark now.
- Build tier: **this planning is the judgment; the build is pattern-following** — executable by a
  Sonnet/Haiku session straight from this doc.

## Verification checklist (done = all green)
- [ ] `npx tsc --noEmit` clean; `npx eslint` clean on new/changed files (baseline is 9 err/7 warn in
      untouched files — add zero new).
- [ ] New Dexie migration? NO — `volunteerShifts` store already exists (schema v7); this only adds a
      cloud write + reuses the existing pull. Do not bump the Dexie version.
- [ ] **Live end-to-end test** (mirror how the T1/T2 fix was verified): POST a diagnostic check-in to
      the deployed `/api/public/volunteer-checkin`, confirm a `pantry_volunteer_shifts` row lands in
      Supabase **with `tenant_id`**, then **delete the diagnostic row(s)**. Read `.env.local` for
      `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`; St. Mark tenant_id = `04b7516b-5672-4bab-95d0-2ac00974132c`.
- [ ] Idempotency: POST the same check-in twice → one shift row, endpoint returns ok both times.
- [ ] Error path: a forced failure returns 500, NOT a false 200 (the T1/T2 lesson).
- [ ] After a device sync, the check-in appears in the Chromebook's volunteer report.

## Protected actions (Wilson's per-action OK required — do NOT self-approve)
- `git push origin master` and the Vercel **production deploy** each need Wilson's explicit go.
- The live end-to-end test writes+deletes a diagnostic row on real St. Mark data — fine because it's
  self-cleaning, but never leave a diagnostic row behind.

## Files at a glance
- Clone from: `api/public/signup.ts` (the tenant-stamped, error-checked public-write template).
- Shared constant: `api/_lib/tenant.ts` → `DEFAULT_TENANT_ID`.
- Types: `src/types/index.ts` (`VolunteerShift` @ ~L85, `Volunteer` @ ~L72).
- Routing precedent: `src/main.tsx` (hostname/path branch used by demo + Startup Guide).
- Sync pull (already handles volunteerShifts): `src/lib/sync-engine.ts:261`, `api/sync/pull.ts`.
- Chromebook check-in UI precedent (staff fallback, leave as-is): `src/components/volunteers/VolunteerCheckIn.tsx`.

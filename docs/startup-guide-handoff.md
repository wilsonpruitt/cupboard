# Handoff: Cupboard Interactive Startup Guide

**For the executing session.** Recommended model: **Sonnet** — this is pattern-following feature work; all judgment calls are already made below (planned with Wilson on Fable, 2026-07-15). Read `docs/pantry-playbook.md` (the content source) and this doc before writing code. The product spec is `docs/cupboard-product-spec.md`; the demo-mode precedent is `src/lib/demo.ts`.

## What you're building

A public, interactive "Start a Pantry" guide at **`start.cupboard.cc`** — an adaptation of the pantry playbook into a guided, stateful web experience. Audience: a church volunteer or pastor with no pantry and no Cupboard account. Goal: genuinely useful standalone tool + captured lead + a soft on-ramp to Cupboard.

Decisions already made with Wilson — do not re-ask:
- Public lead-gen page mirroring demo mode (not an in-app module).
- Permit question is an interactive decision tree only; the 254-county TX lookup table is phase 2.
- Voice: generic church, TX-aware (de-Methodized — rules below).

## Architecture (decided — don't relitigate)

1. **Subdomain, not a path.** `start.cupboard.cc`, exactly like `demo.cupboard.cc`. Reason: the SPA registers a service worker; serving it at `cupboard.cc/start` would register the SW on the apex origin and can interfere with the static landing page's caching. Per-origin localStorage also isolates guide progress from every tenant.
2. **Guide mode branches before the gates.** Add `src/lib/guide.ts` with `isGuideMode()`: exact hostname `start.cupboard.cc`, plus a `?guide=1` sticky-session dev affordance on localhost/`*.vercel.app` only (copy the `isDemoMode()` pattern verbatim). In `main.tsx`/`App.tsx`, when guide mode is on, render a dedicated `<StartupGuideApp/>` component tree **instead of** the gated app — do NOT wrap in `DemoGate`/`TenantAuthGate`/`LoginGate`/`SyncProvider`, do NOT touch Dexie or `PantrySettings`, do NOT start the sync engine. The guide is its own small app that happens to live in this bundle and reuse `src/components/ui`.
3. **St. Mark safety invariant (binding, same as Track A):** guide code must be provably dead on `stmark.cupboard.cc`, every tenant host, and the apex. Exact-host check only. Zero changes to existing gate/sync behavior.
4. **State:** one localStorage key, `cupboard-startup-guide-v1`, holding a single JSON object:
   ```ts
   { churchName?: string, town?: string, permitAnswers: Record<string,string>,
     checked: Record<string, boolean>,   // checklist item ids
     householdsPerMonth?: number, targetLaunchMonth?: string /* '2026-10' */ }
   ```
   Load once, write-through on change. No migrations needed at v1.
5. **Content lives in a data module**, `src/data/startup-guide.ts` — steps, checklist items (stable string ids), scripts, program cards — so future edits are content edits, not component edits. Adapt the text from `docs/pantry-playbook.md` applying the voice rules below.

## The six modules (screens/sections of the guide)

Single-page stepper or scrollable sections with a sticky progress nav — executor's choice; keep it mobile-friendly (church volunteers will open this on phones).

1. **The Core Model** — the pitch + startup-cost table from the playbook, near-verbatim. Inputs: church name + town (personalizes everything downstream).
2. **Permit Finder** — interactive decision tree, playbook Step 1:
   - Q1 "Does your city or county have its own health department or public health district?" (Yes / No / Not sure). "Not sure" → show the short list of known TX local health authorities from the playbook (Austin/Travis, San Antonio Metro, Williamson, Hays, Comal, Nueces, Cameron, Hidalgo) labeled explicitly as *examples, not an exhaustive list*, with a link to the DSHS local-health-entities directory, then let them answer.
   - No → verdict card: DSHS jurisdiction, no permit for nonprofit prepackaged distribution; "keep the exemption language on file."
   - Yes → verdict card: one phone call, with the playbook's exact call script in a copy-button card.
   - Both verdicts get: the cold-chain expectations note (refrigerated/frozen raises the bar, discipline = credibility), "never cook or repackage on-site," and the Good Samaritan / Texas Good Faith Donor Act liability blurb for trustees.
   - **Compliance discipline:** this is regulatory guidance. Present verdicts as "here's what to confirm," never "you're legally cleared." Follow the repo's provisional-verify pattern (`VERIFIED` flags, cf. `usda-nondiscrimination.ts`) for any statute/program names you carry over; do not invent citations.
3. **Sourcing Map** — the four streams as expandable sections, each a checklist:
   - Stream 1 corporate programs as cards (Panera Day-End Dough-Nation, Trader Joe's Neighborhood Shares, Whole Foods/FDC, Food Donation Connection, Chick-fil-A Shared Table) with "how to get it" and the rural reality-check callout.
   - Streams 2–4 as checklists. The four scripts (playbook Step 3 A–D) as copy-button cards attached to the relevant stream.
4. **Volunteer Calculator** — input: households/month (slider or number). Output: the playbook Step 4 table row (interpolated between tiers), the distribution-day role list, and the client-choice vs. pre-packed note. Pure function, unit-test the tier boundaries.
5. **Pilot Timeline** — input: target first-distribution month. Output: a dated, checkable plan — playbook Step 5 mapped onto real month names (target minus 2 = setup tasks incl. permit call, Panera/FDC applications "start the clock now", 211 Texas + Google Business listing; target month = first distribution with the publicity checklist; +1..+3 = rhythm; +3 = scale-decision note at the 30-families/week line).
6. **Council One-Pager + Finish** — printable summary (print CSS) pre-filled from their state: church name, permit verdict, volunteer roster size, launch month, the playbook's one-page council summary adapted to voice rules. Then two CTAs:
   - **"Email me my plan"** → POST to the existing `/api/cupboard-interest` with `name`, `email`, `organization` (= church name), and extend the endpoint with an optional `source: 'startup-guide'` + a short `planSummary` string (county answer, target month, households) so Wilson's notification email is a rich lead. Keep the endpoint's existing behavior byte-identical when the new fields are absent.
   - **Cupboard on-ramp:** "When distribution day comes, Cupboard runs your check-in — free for a single device." → links to `demo.cupboard.cc` and the landing page.

## Voice rules (apply throughout — generic church, TX-aware)

- "GCFA group ruling letter" → "your 501(c)(3) status (many denominations cover congregations under a group ruling — ask your denominational office)."
- "charge conference report" → "your board or council report." "Council/trustees approve" → "board/council approves."
- "The Connectional Multiplier (very Methodist)" → a short generic section, "The Network Model": one well-located church holds the corporate-program relationships and the big freezer; nearby sister congregations run spoke distributions. Drop "charge-conference-ready" and the North District pilot line.
- Keep ALL Texas legal/regulatory specifics (DSHS, Texas Good Faith Donor Act, 211 Texas) and all program names verbatim.
- No invented content: statutes, program names, and eligibility claims come from the playbook only (per Wilson's standing `feedback_no-invented-content-on-public-sites` rule).

## Deployment sequence (after code review + local verify)

1. Commit on a short-lived branch; merge to `main` per Wilson's git workflow (explain merges in plain English; pushing `main` = protected action, ask first).
2. `npx vercel domains add start.cupboard.cc` (this repo's linked project; demo precedent 2026-05-18) + Cloudflare CNAME `start` → `cname.vercel-dns.com`, **DNS-only** (grey cloud).
3. Add a "Start a pantry — free guide" link to `public/cupboard/index.html` (hero + nav, next to the live-demo links).
4. While touching the landing page: do the **Vercel Web Analytics TODO** at the top of this repo's `CLAUDE.md` (enable in dashboard + snippet), then delete that TODO section.
5. Production deploy = protected action; per-action OK from Wilson.

## QA checklist

- `stmark.cupboard.cc` and `demo.cupboard.cc` behave byte-identically (guide mode dead there) — Playwright check like the Track A verification.
- Guide works logged-out, cold cache, on a phone-width viewport; progress survives reload.
- Print stylesheet: one-pager prints on a single page, no nav chrome.
- `pnpm test` (vitest) — calculator + timeline pure functions covered. **pnpm via corepack, never npm.**
- No new lint errors (baseline is 9 errors / 7 warnings, all pre-existing).

## Phase 2 (do NOT build now — noted for the roadmap)

- **TX county→jurisdiction lookup table** (playbook's build-note schema: `county_fips`, `health_jurisdiction`, `authority_phone`, `cfo_fee_waiver`…). Research-heavy; needs DSHS-directory verification and a city-limits caveat. Its own session, likely paired with the hub/spoke mapping dataset.
- Carrying guide progress into a real tenant at signup.
- Spanish version (spec already defers multi-language).

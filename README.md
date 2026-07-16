# Cupboard

Offline-first PWA for client & volunteer tracking at small feeding ministries — pantries, soup kitchens, backpack programs, mobile distributions. Built by Wroot Labs.

St. Mark UMC's food pantry runs this in production as tenant zero (`stmark.cupboard.cc`).

## Stack

React 19, Vite 7, TypeScript, Dexie.js (IndexedDB as source of truth) with a Supabase mirror for multi-device sync, Tailwind CSS 4, shadcn/ui.

## Sites in this repo

- `stmark.cupboard.cc` / `{tenant}.cupboard.cc` — the app itself (tenant-scoped, `src/`)
- `cupboard.cc` — marketing landing (`public/cupboard/`)
- `start.cupboard.cc` — interactive "Start a Pantry" guide, public lead-gen (`src/components/startup-guide/`)
- `stmarklegacy.org` — St. Mark's own site (`public/site/`)

Host routing lives in `middleware.ts`.

## Docs

- `docs/cupboard-product-spec.md` — product spec and build sequence
- `FEATURES.md` — feature inventory
- `CLAUDE.md` — project instructions for Claude Code

## Development

```bash
pnpm install
pnpm dev
```

`pnpm test` runs vitest, `pnpm lint` runs eslint, `pnpm build` type-checks and builds.

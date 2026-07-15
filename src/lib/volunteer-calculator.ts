// Playbook Step 4 volunteer roster sizing — interpolated between the
// playbook's three tiers so any households/month input gets a real number,
// not just a bucket.

export interface VolunteerTierRow {
  householdsPerMonth: number
  weeklyPickups: number
  stockingDay: number
  distributionDay: number
  totalRoster: number
}

// Midpoints of the playbook's three bands, used as interpolation anchors.
const ANCHORS: VolunteerTierRow[] = [
  { householdsPerMonth: 20, weeklyPickups: 1.5, stockingDay: 2, distributionDay: 4, totalRoster: 7 },
  { householdsPerMonth: 37.5, weeklyPickups: 2.5, stockingDay: 3, distributionDay: 6.5, totalRoster: 11 },
  { householdsPerMonth: 75, weeklyPickups: 3.5, stockingDay: 4, distributionDay: 10.5, totalRoster: 16 },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function volunteerRosterFor(householdsPerMonth: number): VolunteerTierRow {
  const h = Math.max(1, householdsPerMonth)

  let lo = ANCHORS[0]
  let hi = ANCHORS[ANCHORS.length - 1]
  if (h <= ANCHORS[0].householdsPerMonth) {
    lo = ANCHORS[0]
    hi = ANCHORS[0]
  } else if (h >= ANCHORS[ANCHORS.length - 1].householdsPerMonth) {
    lo = ANCHORS[ANCHORS.length - 1]
    hi = ANCHORS[ANCHORS.length - 1]
  } else {
    for (let i = 0; i < ANCHORS.length - 1; i++) {
      if (h >= ANCHORS[i].householdsPerMonth && h <= ANCHORS[i + 1].householdsPerMonth) {
        lo = ANCHORS[i]
        hi = ANCHORS[i + 1]
        break
      }
    }
  }

  const span = hi.householdsPerMonth - lo.householdsPerMonth
  const t = span === 0 ? 0 : (h - lo.householdsPerMonth) / span

  const round = (n: number) => Math.round(n)
  return {
    householdsPerMonth: h,
    weeklyPickups: round(lerp(lo.weeklyPickups, hi.weeklyPickups, t)),
    stockingDay: round(lerp(lo.stockingDay, hi.stockingDay, t)),
    distributionDay: round(lerp(lo.distributionDay, hi.distributionDay, t)),
    totalRoster: round(lerp(lo.totalRoster, hi.totalRoster, t)),
  }
}

export const DISTRIBUTION_DAY_ROLES = [
  'Greeter / intake (1–2, bilingual where relevant)',
  'Table servers or pantry runners (2–4)',
  'Parking / flow if drive-through (1)',
  'Floater / coordinator (1)',
]

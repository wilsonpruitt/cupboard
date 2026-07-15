// Playbook Step 5 pilot sequence, mapped onto real month names from a target
// first-distribution month. Pure integer year/month math — no Date object,
// so there's no timezone drift turning "October" into "September 30".

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface PilotMilestone {
  offset: number // months relative to target launch (negative = before)
  monthLabel: string // 'October 2026'
  monthKey: string // '2026-10'
  title: string
  tasks: string[]
}

function shiftMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + offset
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 }
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function pilotTimelineFor(targetLaunchMonth: string): PilotMilestone[] {
  const match = /^(\d{4})-(\d{2})$/.exec(targetLaunchMonth)
  if (!match) return []
  const targetYear = Number(match[1])
  const targetMonth = Number(match[2])

  const milestone = (offset: number, title: string, tasks: string[]): PilotMilestone => {
    const { year, month } = shiftMonth(targetYear, targetMonth, offset)
    return { offset, monthLabel: monthLabel(year, month), monthKey: monthKey(year, month), title, tasks }
  }

  return [
    milestone(-2, 'Setup begins', [
      'Council/trustees approve; name a pantry coordinator and a backup',
      'Make the permit call; document the answer in writing',
      'Secure freezer/fridge, thermometers, and lockable shelf space',
      'Two volunteers take the $7 online food handler course',
      'Launch the first-Sunday congregation collection immediately',
      'Apply to Panera Day-End Dough-Nation and register with Food Donation Connection — both slow, start the clock now',
      'Visit 3 independent grocers + 1 chain manager with the scripts',
      'Register with 211 Texas and create a Google Business listing',
    ]),
    milestone(0, 'First distribution', [
      'Advertise two weeks out: bilingual flyer at the post office, laundromat, dollar store, library, school front offices',
      'Note to school counselors and the ministerial alliance',
      'Post in Facebook community groups and Nextdoor',
      'Expect 8–15 households — that’s normal and fine',
    ]),
    milestone(1, 'Building rhythm', [
      'Same Saturday, same hours — consistency is the advertising',
      'Add one new supply relationship this month',
    ]),
    milestone(2, 'Building rhythm', [
      'Same Saturday, same hours',
      'Add one new supply relationship this month',
    ]),
    milestone(3, 'Scale decision', [
      'If you’re pushing past ~30 families a week (not a month), food bank partnership math starts to work',
      'Until then, independence is the better deal — let the pilot’s own data tell you when you’ve crossed the line',
    ]),
  ]
}

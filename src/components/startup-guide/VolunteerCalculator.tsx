import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { volunteerRosterFor, DISTRIBUTION_DAY_ROLES } from '@/lib/volunteer-calculator'
import { CLIENT_CHOICE_NOTE, INTAKE_NOTE } from '@/data/startup-guide'
import type { StartupGuideState } from '@/lib/startup-guide-state'

export function VolunteerCalculator({
  state,
  update,
}: {
  state: StartupGuideState
  update: (patch: Partial<StartupGuideState>) => void
}) {
  const households = state.householdsPerMonth ?? 20
  const roster = volunteerRosterFor(households)

  return (
    <section id="volunteer-calculator" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold">Volunteer Calculator</h2>
      <p className="text-sm text-muted-foreground">
        Rule of thumb: 1 volunteer per 5–6 households served, plus a fixed core of 3, split across two days.
      </p>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="households">Households per month</Label>
        <Input
          id="households"
          type="number"
          min={1}
          value={households}
          onChange={(e) => update({ householdsPerMonth: Number(e.target.value) || 1 })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your estimated roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{roster.weeklyPickups}</p>
              <p className="text-xs text-muted-foreground">Weekly pickups</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{roster.stockingDay}</p>
              <p className="text-xs text-muted-foreground">Stocking day (day before)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{roster.distributionDay}</p>
              <p className="text-xs text-muted-foreground">Distribution day</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{roster.totalRoster}</p>
              <p className="text-xs text-muted-foreground">Total roster</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution-day roles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {DISTRIBUTION_DAY_ROLES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm leading-relaxed text-muted-foreground">{CLIENT_CHOICE_NOTE}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Intake: </span>
        {INTAKE_NOTE}
      </p>
    </section>
  )
}

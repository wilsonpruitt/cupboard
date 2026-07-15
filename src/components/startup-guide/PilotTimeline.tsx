import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { pilotTimelineFor } from '@/lib/pilot-timeline'
import type { StartupGuideState } from '@/lib/startup-guide-state'

export function PilotTimeline({
  state,
  update,
  toggleChecked,
}: {
  state: StartupGuideState
  update: (patch: Partial<StartupGuideState>) => void
  toggleChecked: (id: string) => void
}) {
  const milestones = state.targetLaunchMonth ? pilotTimelineFor(state.targetLaunchMonth) : []

  return (
    <section id="pilot-timeline" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold">Pilot Timeline</h2>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="target-month">Target first-distribution month</Label>
        <Input
          id="target-month"
          type="month"
          value={state.targetLaunchMonth ?? ''}
          onChange={(e) => update({ targetLaunchMonth: e.target.value })}
        />
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pick a target month to see a dated plan.</p>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <Card key={`${m.offset}-${m.title}`}>
              <CardHeader>
                <CardTitle className="text-base">
                  {m.monthLabel} — {m.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {m.tasks.map((task) => {
                  const id = `timeline-${m.monthKey}-${task}`
                  return (
                    <label key={id} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!state.checked[id]}
                        onChange={() => toggleChecked(id)}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className={state.checked[id] ? 'text-muted-foreground line-through' : 'text-muted-foreground'}>
                        {task}
                      </span>
                    </label>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

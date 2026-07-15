import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { STARTUP_COSTS, CORE_MODEL_PITCH } from '@/data/startup-guide'
import type { StartupGuideState } from '@/lib/startup-guide-state'

export function CoreModel({
  state,
  update,
}: {
  state: StartupGuideState
  update: (patch: Partial<StartupGuideState>) => void
}) {
  return (
    <section id="core-model" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold">The Core Model</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{CORE_MODEL_PITCH}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tell us about your church</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="church-name">Church name</Label>
            <Input
              id="church-name"
              value={state.churchName ?? ''}
              onChange={(e) => update({ churchName: e.target.value })}
              placeholder="First Church"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="town">Town</Label>
            <Input
              id="town"
              value={state.town ?? ''}
              onChange={(e) => update({ town: e.target.value })}
              placeholder="Fredericksburg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What it costs to start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Item</th>
                  <th className="py-1.5 font-medium">Typical cost</th>
                </tr>
              </thead>
              <tbody>
                {STARTUP_COSTS.map((row) => (
                  <tr key={row.item} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{row.item}</td>
                    <td className="py-1.5 text-muted-foreground">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

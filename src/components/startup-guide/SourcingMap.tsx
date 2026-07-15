import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from './CopyButton'
import {
  CORPORATE_PROGRAMS,
  RURAL_REALITY_CHECK,
  DIRECT_RELATIONSHIPS_CHECKLIST,
  CONGREGATION_DRIVES_CHECKLIST,
  GLEANING_CHECKLIST,
  SCRIPTS,
  type ChecklistStream,
} from '@/data/startup-guide'
import type { StartupGuideState } from '@/lib/startup-guide-state'

function ChecklistCard({
  stream,
  checked,
  onToggle,
}: {
  stream: ChecklistStream
  checked: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{stream.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stream.items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 size-4 shrink-0"
            />
            <span className={checked[item.id] ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}

export function SourcingMap({
  state,
  toggleChecked,
}: {
  state: StartupGuideState
  toggleChecked: (id: string) => void
}) {
  return (
    <section id="sourcing-map" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold">Sourcing Map</h2>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          Stream 1 — Corporate direct-donation programs (the hidden gems)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CORPORATE_PROGRAMS.map((p) => (
            <Card key={p.name}>
              <CardHeader>
                <CardTitle className="text-sm">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                <p>{p.whatYouGet}</p>
                <p className="text-foreground">{p.howToGetIt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{RURAL_REALITY_CHECK}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ChecklistCard stream={DIRECT_RELATIONSHIPS_CHECKLIST} checked={state.checked} onToggle={toggleChecked} />
        <ChecklistCard stream={CONGREGATION_DRIVES_CHECKLIST} checked={state.checked} onToggle={toggleChecked} />
        <ChecklistCard stream={GLEANING_CHECKLIST} checked={state.checked} onToggle={toggleChecked} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">The Scripts</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCRIPTS.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="text-sm">{s.audience}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{s.when}</p>
                <p className="text-sm text-muted-foreground">{s.text}</p>
                <CopyButton text={s.text} label="Copy script" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

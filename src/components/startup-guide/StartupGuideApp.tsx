import { useEffect } from 'react'
import { useGuideState } from './useGuideState'
import { CoreModel } from './CoreModel'
import { PermitFinder } from './PermitFinder'
import { SourcingMap } from './SourcingMap'
import { VolunteerCalculator } from './VolunteerCalculator'
import { PilotTimeline } from './PilotTimeline'
import { CouncilSummary } from './CouncilSummary'

const SECTIONS = [
  { id: 'core-model', label: 'Core Model' },
  { id: 'permit-finder', label: 'Permit' },
  { id: 'sourcing-map', label: 'Sourcing' },
  { id: 'volunteer-calculator', label: 'Volunteers' },
  { id: 'pilot-timeline', label: 'Timeline' },
  { id: 'council-summary', label: 'Summary' },
]

export function StartupGuideApp() {
  const { state, update, toggleChecked, setPermitAnswer } = useGuideState()

  useEffect(() => {
    document.title = 'Start a Pantry — Cupboard'
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a href="https://cupboard.cc" className="font-bold">
            Cupboard <span className="font-normal text-muted-foreground">— Start a Pantry</span>
          </a>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-2.5 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <div className="print:hidden">
          <h1 className="text-2xl font-bold">Start a food pantry — free guide</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A guided walk through starting a nearly-zero-budget food pantry, built from a startup
            playbook used by Texas congregations. Your answers stay in this browser — nothing is saved
            until you choose to email yourself a plan.
          </p>
        </div>

        <CoreModel state={state} update={update} />
        <PermitFinder state={state} setPermitAnswer={setPermitAnswer} />
        <SourcingMap state={state} toggleChecked={toggleChecked} />
        <VolunteerCalculator state={state} update={update} />
        <PilotTimeline state={state} update={update} toggleChecked={toggleChecked} />
        <CouncilSummary state={state} />
      </main>
    </div>
  )
}

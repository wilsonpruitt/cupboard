import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { volunteerRosterFor } from '@/lib/volunteer-calculator'
import { NETWORK_MODEL_TITLE, NETWORK_MODEL_BODY, CUPBOARD_ONRAMP_NOTE } from '@/data/startup-guide'
import type { StartupGuideState } from '@/lib/startup-guide-state'

function permitVerdictLabel(state: StartupGuideState): string {
  const answer = state.permitAnswers['has-local-health-authority']
  if (answer === 'no') return 'Under DSHS jurisdiction — no permit likely needed'
  if (answer === 'yes') return 'One phone call to confirm with the local health authority'
  return 'Not yet determined — see Permit Finder'
}

function buildPlanSummary(state: StartupGuideState): string {
  const roster = state.householdsPerMonth ? volunteerRosterFor(state.householdsPerMonth) : null
  const lines = [
    state.town ? `Town: ${state.town}` : null,
    `Permit: ${permitVerdictLabel(state)}`,
    roster ? `Est. households/month: ${roster.householdsPerMonth} (roster ~${roster.totalRoster})` : null,
    state.targetLaunchMonth ? `Target launch: ${state.targetLaunchMonth}` : null,
  ].filter(Boolean)
  return lines.join(' · ')
}

export function CouncilSummary({ state }: { state: StartupGuideState }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const roster = state.householdsPerMonth ? volunteerRosterFor(state.householdsPerMonth) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/cupboard-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          organization: state.churchName || undefined,
          source: 'startup-guide',
          planSummary: buildPlanSummary(state),
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setSent(true)
      toast.success('Sent — check your inbox.')
    } catch {
      toast.error('Could not send right now. Try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="council-summary" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold print:hidden">Council One-Pager</h2>

      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle>{state.churchName || 'Your Church'} Food Pantry — Council Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">What: </span>
            A free monthly food distribution using directly donated food — no food bank contract, no
            external reporting.
          </p>
          <p>
            <span className="font-medium">Cost: </span>
            Under $500 to start, often far less; usually $0 in permits.
          </p>
          <p>
            <span className="font-medium">People: </span>
            {roster ? `~${roster.totalRoster} volunteers` : '6–8 volunteers'}, one Saturday a month, plus
            a weekly pickup runner.
          </p>
          <p>
            <span className="font-medium">Permit: </span>
            {permitVerdictLabel(state)}
          </p>
          <p>
            <span className="font-medium">Legal: </span>
            Federal and state Good Samaritan donor laws protect us and our donors; confirm your
            501(c)(3) status is on file (many denominations cover congregations under a group ruling —
            ask your denominational office).
          </p>
          <p>
            <span className="font-medium">Path: </span>
            2 months setup → monthly pilot → add one supply relationship per month → reassess at 30
            families/week.
            {state.targetLaunchMonth ? ` Target first distribution: ${state.targetLaunchMonth}.` : ''}
          </p>
          <p>
            <span className="font-medium">Why us: </span>
            In our community, the church building, the fellowship hall freezer, and the trust we
            already hold are the food security infrastructure.
          </p>
        </CardContent>
      </Card>

      <div className="print:hidden">
        <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{NETWORK_MODEL_TITLE}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{NETWORK_MODEL_BODY}</p>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Email me my plan</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              On its way — thanks for working through the guide.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="lead-name">Name</Label>
                <Input id="lead-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send my plan'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-sm text-muted-foreground">{CUPBOARD_ONRAMP_NOTE}</p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href="https://demo.cupboard.cc">Try the demo</a>
            </Button>
            <Button asChild>
              <a href="https://cupboard.cc">Learn about Cupboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

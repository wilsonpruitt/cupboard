import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CopyButton } from './CopyButton'
import {
  KNOWN_TX_LOCAL_AUTHORITIES,
  DSHS_LOCAL_HEALTH_DIRECTORY_URL,
  PERMIT_CALL_SCRIPT,
  PERMIT_VERDICT_NO_AUTHORITY,
  PERMIT_VERDICT_HAS_AUTHORITY,
  COLD_CHAIN_NOTE,
  NO_ONSITE_COOKING_NOTE,
  LIABILITY_NOTE,
} from '@/data/startup-guide'
import type { StartupGuideState } from '@/lib/startup-guide-state'

const QUESTION = 'has-local-health-authority'

function VerdictCard({ headline, body }: { headline: string; body: string }) {
  return (
    <Alert>
      <AlertDescription className="space-y-2">
        <p className="font-semibold text-foreground">{headline}</p>
        <p>{body}</p>
      </AlertDescription>
    </Alert>
  )
}

export function PermitFinder({
  state,
  setPermitAnswer,
}: {
  state: StartupGuideState
  setPermitAnswer: (question: string, answer: string) => void
}) {
  const answer = state.permitAnswers[QUESTION]

  return (
    <section id="permit-finder" className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-bold">Permit Finder</h2>
      <p className="text-sm text-muted-foreground">
        This is regulatory guidance to help you confirm your situation — not a legal clearance. Use the
        verdict below as what to confirm, not a final answer.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Does your city or county have its own health department or public health district?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={answer === 'no' ? 'default' : 'outline'}
              onClick={() => setPermitAnswer(QUESTION, 'no')}
            >
              No
            </Button>
            <Button
              type="button"
              variant={answer === 'yes' ? 'default' : 'outline'}
              onClick={() => setPermitAnswer(QUESTION, 'yes')}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={answer === 'not-sure' ? 'default' : 'outline'}
              onClick={() => setPermitAnswer(QUESTION, 'not-sure')}
            >
              Not sure
            </Button>
          </div>

          {answer === 'not-sure' && (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <p className="mb-2 text-muted-foreground">
                A few known Texas local health authorities — examples, not an exhaustive list:
              </p>
              <ul className="mb-2 list-inside list-disc space-y-0.5">
                {KNOWN_TX_LOCAL_AUTHORITIES.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <a
                href={DSHS_LOCAL_HEALTH_DIRECTORY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                Look up your county in the DSHS local health entities directory
              </a>
            </div>
          )}

          {answer === 'no' && <VerdictCard {...PERMIT_VERDICT_NO_AUTHORITY} />}

          {answer === 'yes' && (
            <>
              <VerdictCard {...PERMIT_VERDICT_HAS_AUTHORITY} />
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Call script</p>
                <p className="text-sm text-muted-foreground">{PERMIT_CALL_SCRIPT}</p>
                <CopyButton text={PERMIT_CALL_SCRIPT} label="Copy script" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(answer === 'yes' || answer === 'no') && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{COLD_CHAIN_NOTE}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{NO_ONSITE_COOKING_NOTE}</p>
          <Alert>
            <AlertDescription>
              <span className="font-medium text-foreground">For the trustees: </span>
              {LIABILITY_NOTE}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </section>
  )
}

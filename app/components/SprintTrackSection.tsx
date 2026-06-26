import {
  OFFICE_HOURS_NOTE,
  pickSprintForCandidate,
  type SprintContext,
} from "@/lib/intake-sprints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SprintTrackSectionProps = {
  context: SprintContext;
  intro?: string;
};

export function SprintTrackSection({ context, intro }: SprintTrackSectionProps) {
  const { card: sprint, reason } = pickSprintForCandidate(context);

  return (
    <div className="space-y-6">
      {intro ? (
        <p className="text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">{intro}</p>
      ) : null}

      <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm md:p-5 md:text-[0.9375rem]">
        <p className="font-medium text-foreground">Grounded in your intake</p>
        <dl className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Space</dt>
            <dd>{context.spaceLane}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Role north star</dt>
            <dd>{context.roleNorthStar}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Keywords</dt>
            <dd>{context.keywordsSummary}</dd>
          </div>
          {context.locationHint ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Location hint</dt>
              <dd>{context.locationHint}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <Card className="border-primary/35 bg-card shadow-sm">
        <CardHeader className="space-y-2 p-6 md:p-8">
          <CardTitle className="text-xl tracking-tight">How your sprint wraps</CardTitle>
          <CardDescription className="text-base leading-relaxed text-muted-foreground">
            {OFFICE_HOURS_NOTE} It runs fourteen days—you ship a tangible artifact while documenting how you partnered
            with automation.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="h-full border-border/75 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <CardHeader className="space-y-3 border-b border-border/55 p-6 md:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Matched sprint · 6 weeks · AI-forward cohort
          </p>
          <CardTitle className="text-xl leading-snug tracking-tight">{sprint.title}</CardTitle>
          <CardDescription className="text-base leading-relaxed text-muted-foreground">
            {sprint.teaser}
          </CardDescription>
          <p className="rounded-xl bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
            <span className="font-semibold text-foreground">Why this one:</span> {reason}
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 p-6 md:p-7">
          <section>
            <h3 className="text-sm font-semibold text-foreground">AI-ready practice lane</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sprint.aiForward}</p>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold text-foreground">Week one</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {sprint.weekOne.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-foreground">Week two</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {sprint.weekTwo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Ship</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{sprint.deliverable}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Office hours rehearsal: live critique on both the artifact and how you wielded automation.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

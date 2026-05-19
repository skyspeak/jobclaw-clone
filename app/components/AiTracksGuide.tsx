import Link from "next/link";

import {
  AI_TRACKS,
  AI_TRACKS_GUIDE_INTRO,
  AI_TRACKS_GUIDE_TITLE,
  AI_TRACKS_PATTERN,
} from "@/lib/ai-tracks-data";
import { TrackCommitButton } from "@/app/components/TrackCommitButton";
import { Button } from "@/components/ui/button";

export type AiTracksGuideProps = {
  eyebrow: string;
  title?: string;
  itemLabel?: "Track" | "Sprint";
};

export function AiTracksGuide({
  eyebrow,
  title = AI_TRACKS_GUIDE_TITLE,
  itemLabel = "Track",
}: AiTracksGuideProps) {
  const intro = AI_TRACKS_GUIDE_INTRO;
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-24">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/">Back to home</Link>
        </Button>

        <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">{intro.lead}</p>
          <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">{intro.throughline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="cta-glow rounded-2xl">
              <a href="/api/ai-tracks-guide?download=1">Download HTML guide</a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <a href="/api/ai-tracks-guide" rel="noreferrer" target="_blank">
                Open raw HTML
              </a>
            </Button>
          </div>
        </header>

        <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{intro.structureIntro}</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Section
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What it is
                  </th>
                </tr>
              </thead>
              <tbody>
                {intro.structureRows.map((row) => (
                  <tr key={row.name} className="border-b border-border/80 last:border-0">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {itemLabel === "Sprint"
              ? `A "sprint" here means a focused two-week solo build, not a Scrum ceremony. Nights and weekends count.`
              : intro.footnote}
          </p>
        </section>

        {AI_TRACKS.map((track) => (
          <article
            key={track.id}
            id={track.id}
            className="scroll-mt-8 rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10"
          >
            <p className="mb-3 inline-flex rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
              {itemLabel} {track.number}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{track.title}</h2>
            <p className="mt-1 text-lg italic text-muted-foreground">{track.subtitle}</p>
            <p className="mt-5 text-sm leading-relaxed text-foreground sm:text-base">
              <span className="font-semibold text-primary">The bet.</span> {track.bet}
            </p>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
              <p>
                <span className="font-semibold text-primary">Week 1.</span> {track.week1}
              </p>
              <p>
                <span className="font-semibold text-primary">Week 2.</span> {track.week2}
              </p>
            </div>

            <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Deliverables
            </h3>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {track.deliverables.map((row) => (
                    <tr key={row.name} className="border-b border-border/80 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tool stack
            </h3>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tool
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      What you&apos;ll have done with it
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {track.tools.map((row) => (
                    <tr key={row.name} className="border-b border-border/80 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <blockquote className="mt-8 border-l-4 border-primary bg-primary/5 px-5 py-4 text-sm font-medium leading-relaxed text-foreground sm:text-base">
              Outcomes you can claim: &ldquo;{track.outcomes}&rdquo;
            </blockquote>

            <TrackCommitButton trackId={track.id} />
          </article>
        ))}

        <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{AI_TRACKS_PATTERN.title}</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sector
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    The thing you build
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    The thing that proves you built it
                  </th>
                </tr>
              </thead>
              <tbody>
                {AI_TRACKS_PATTERN.rows.map((row) => (
                  <tr key={row.sector} className="border-b border-border/80 last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.sector}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.build}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{AI_TRACKS_PATTERN.closing}</p>
        </section>
      </div>
    </main>
  );
}

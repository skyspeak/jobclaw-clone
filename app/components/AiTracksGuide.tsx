import Link from "next/link";

import {
  AI_TRACKS,
  AI_TRACKS_GUIDE_INTRO,
  AI_TRACKS_GUIDE_TITLE,
  AI_TRACKS_PATTERN,
  AI_PROJECT_SPRINTS,
  AI_PROJECT_SPRINTS_INTRO,
  AI_PROJECT_SPRINTS_PATTERN,
  type AiTrack,
  type AiTracksGuideIntro,
  type AiTracksGuidePattern,
} from "@/lib/ai-tracks-data";
import { ProjectSprintNav } from "@/app/components/ProjectSprintNav";
import { TrackCommitButton } from "@/app/components/TrackCommitButton";
import { Button } from "@/components/ui/button";
import type { ProjectSprintSlug } from "@/lib/ai-tracks-data";

export type AiTracksGuideProps = {
  eyebrow: string;
  title?: string;
  itemLabel?: "Track" | "Sprint";
  tracks?: AiTrack[];
  intro?: AiTracksGuideIntro;
  pattern?: AiTracksGuidePattern;
  showDownload?: boolean;
  /** Single-track pages: commit fixed top-right; pattern block moves above where commit was inline. */
  stickyCommit?: boolean;
  /** Sprint detail pages: Home + this sprint only (no hub / cohort links). */
  sprintNav?: { slug: ProjectSprintSlug; title: string };
};

function PatternSection({
  pattern,
  embedded = false,
}: {
  pattern: AiTracksGuidePattern;
  embedded?: boolean;
}) {
  return (
    <section className={embedded ? "mt-8" : "rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10"}>
      <h2
        className={
          embedded
            ? "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            : "text-xl font-bold tracking-tight text-foreground"
        }
      >
        {pattern.title}
      </h2>
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
            {pattern.rows.map((row) => (
              <tr key={row.sector} className="border-b border-border/80 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{row.sector}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.build}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.proof}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{pattern.closing}</p>
    </section>
  );
}

export function AiTracksGuide({
  eyebrow,
  title = AI_TRACKS_GUIDE_TITLE,
  itemLabel = "Track",
  tracks = AI_TRACKS,
  intro = AI_TRACKS_GUIDE_INTRO,
  pattern = AI_TRACKS_PATTERN,
  showDownload = true,
  stickyCommit = false,
  sprintNav,
}: AiTracksGuideProps) {
  const singleTrack = stickyCommit && tracks.length === 1 ? tracks[0] : null;

  return (
    <main className="relative min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      {singleTrack ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 sm:px-8 sm:pt-6">
          <div className="pointer-events-auto flex w-full max-w-3xl justify-end">
            <TrackCommitButton trackId={singleTrack.id} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-24">
        {sprintNav ? (
          <ProjectSprintNav sprintSlug={sprintNav.slug} sprintTitle={sprintNav.title} />
        ) : (
          <Button variant="outline" asChild className="w-fit rounded-2xl">
            <Link href="/">Back to home</Link>
          </Button>
        )}

        <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">{intro.lead}</p>
          <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">{intro.throughline}</p>
          {showDownload ? (
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
          ) : null}
        </header>

        {itemLabel !== "Sprint" ? (
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
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{intro.footnote}</p>
          </section>
        ) : null}

        {tracks.map((track) => (
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
              <span className="font-semibold text-primary">
                {itemLabel === "Sprint" ? "The promise." : "The bet."}
              </span>{" "}
              {track.bet}
            </p>
            {track.whatYouDo ? (
              <p className="mt-4 text-sm leading-relaxed text-foreground sm:text-base">
                <span className="font-semibold text-primary">What you&apos;re doing.</span> {track.whatYouDo}
              </p>
            ) : null}
            {itemLabel !== "Sprint" && (track.week1.trim() || track.week2.trim()) ? (
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
                {track.week1.trim() ? (
                  <p>
                    <span className="font-semibold text-primary">Week 1.</span> {track.week1}
                  </p>
                ) : null}
                {track.week2.trim() ? (
                  <p>
                    <span className="font-semibold text-primary">Week 2.</span> {track.week2}
                  </p>
                ) : null}
              </div>
            ) : null}

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
              {itemLabel === "Sprint" ? "AI-native tool stack" : "Tool stack"}
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

            {!stickyCommit ? <TrackCommitButton trackId={track.id} className="mt-8 w-full sm:w-auto" /> : null}
          </article>
        ))}

        {!stickyCommit ? <PatternSection pattern={pattern} /> : null}
      </div>
    </main>
  );
}

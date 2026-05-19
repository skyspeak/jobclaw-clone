"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCandidateContextFromSession,
  verdictDescription,
  verdictLabel,
  type JobFitResult,
  type JobFitVerdict,
} from "@/lib/job-fit";
import { readIntakeSession } from "@/lib/intake-session";
import { cn } from "@/lib/utils";

const JOB_FIT_JD_STORAGE_KEY = "jobclaw.job-fit.jd.v1";

export function JobFitAnalyzer() {
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [fetchNote, setFetchNote] = useState("");
  const [result, setResult] = useState<JobFitResult | null>(null);

  const hasIntakeSession = useMemo(() => {
    if (typeof window === "undefined") return false;
    const session = readIntakeSession();
    return Boolean(session.result?.summary || session.resumeText?.trim());
  }, []);

  async function handleFetch() {
    const url = jobUrl.trim();
    if (!url) {
      setError("Enter a job posting URL to fetch.");
      return;
    }

    setIsFetching(true);
    setError("");
    setFetchNote("");

    try {
      const response = await fetch("/api/job-post-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: url }),
      });
      const payload = (await response.json()) as {
        text?: string;
        error?: string;
        suggestPaste?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not fetch that URL.");
      }

      if (payload.text) {
        setJobDescription(payload.text);
        setFetchNote("Posting loaded — review and edit before analyzing.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not fetch job posting.");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();

    const text = jobDescription.trim();
    if (text.length < 80) {
      setError("Paste at least a few sentences of the job description, or fetch from a URL first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    const session = readIntakeSession();
    const candidate = buildCandidateContextFromSession({
      resumeText: session.resumeText,
      result: session.result,
      profileDraft: session.profileDraft,
      wizardAnswers: session.wizardAnswers,
    });

    try {
      const response = await fetch("/api/job-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: text,
          jobUrl: jobUrl.trim() || undefined,
          candidate,
        }),
      });

      const payload = (await response.json()) as {
        result?: JobFitResult;
        analyzedText?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      if (payload.result) {
        setResult(payload.result);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(JOB_FIT_JD_STORAGE_KEY, text);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleTailorResume() {
    if (typeof window !== "undefined" && jobDescription.trim()) {
      sessionStorage.setItem(JOB_FIT_JD_STORAGE_KEY, jobDescription.trim());
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Target className="size-3.5" />
          Job fit
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Can you win this job?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Paste a job description or fetch from a career page URL. We compare required skills and levels
          to your intake brief and résumé when available.
        </p>
        {!hasIntakeSession ? (
          <p className="text-sm text-muted-foreground">
            No intake session found — analysis uses your pasted résumé only.{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/intake">
              Take the quiz
            </Link>{" "}
            for richer context.
          </p>
        ) : null}
      </header>

      <form onSubmit={(e) => void handleAnalyze(e)} className="flex flex-col gap-6">
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-url">Job posting URL (optional)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="job-url"
                  type="url"
                  placeholder="https://boards.greenhouse.io/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 rounded-xl"
                  disabled={isFetching || !jobUrl.trim()}
                  onClick={() => void handleFetch()}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Fetching…
                    </>
                  ) : (
                    "Fetch posting"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Works best on Greenhouse, Lever, and company career pages. LinkedIn usually requires paste.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Job description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={12}
                className="min-h-[200px] rounded-2xl font-mono text-sm"
              />
              {fetchNote ? <p className="text-sm text-muted-foreground">{fetchNote}</p> : null}
            </div>
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="cta-glow h-14 w-full rounded-2xl text-base font-semibold sm:w-auto sm:px-10"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Analyzing fit…
            </>
          ) : (
            <>
              Analyze job fit
              <ArrowRight className="size-5 opacity-90" />
            </>
          )}
        </Button>
      </form>

      {result ? <JobFitResultsCard result={result} onTailorClick={handleTailorResume} /> : null}
    </div>
  );
}

function JobFitResultsCard({
  result,
  onTailorClick,
}: {
  result: JobFitResult;
  onTailorClick: () => void;
}) {
  const statusBySkill = useMemo(() => {
    const map = new Map<string, (typeof result.candidateSkills)[number]>();
    for (const c of result.candidateSkills) {
      map.set(c.skill.toLowerCase(), c);
    }
    return map;
  }, [result.candidateSkills]);

  return (
    <section className="flex flex-col gap-6">
      <VerdictBanner verdict={result.verdict} headline={result.headline} summary={result.summary} />

      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Role
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{result.roleTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.seniority}</p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Skill</th>
                <th className="pb-3 pr-4">Required</th>
                <th className="pb-3 pr-4">Your fit</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.requirements.map((req) => {
                const match =
                  statusBySkill.get(req.skill.toLowerCase()) ??
                  result.candidateSkills.find((c) =>
                    c.skill.toLowerCase().includes(req.skill.toLowerCase().slice(0, 6)),
                  );
                return (
                  <tr key={req.skill} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{req.skill}</td>
                    <td className="py-3 pr-4 capitalize text-muted-foreground">
                      {req.level}
                      {req.importance === "preferred" ? " · preferred" : ""}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{match?.note || "—"}</td>
                    <td className="py-3">
                      <StatusBadge status={match?.status ?? "missing"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {result.gapsToClose.length > 0 ? (
        <div className="rounded-3xl border border-border/70 bg-muted/15 p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Gaps to close
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground">
            {result.gapsToClose.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button asChild variant="outline" className="h-12 w-fit rounded-2xl" onClick={onTailorClick}>
        <Link href="/tailor-resume">Tailor résumé for this job</Link>
      </Button>
    </section>
  );
}

function VerdictBanner({
  verdict,
  headline,
  summary,
}: {
  verdict: JobFitVerdict;
  headline: string;
  summary: string;
}) {
  const styles: Record<JobFitVerdict, string> = {
    ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50",
    stretch: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-50",
    gap: "border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-50",
  };

  return (
    <div
      className={cn("rounded-3xl border p-6 sm:p-8", styles[verdict])}
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80">
        {verdictLabel(verdict)}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {headline || verdictLabel(verdict)}
      </h2>
      <p className="mt-1 text-sm opacity-90">{verdictDescription(verdict)}</p>
      <p className="mt-4 text-sm leading-relaxed opacity-95 sm:text-base">{summary}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "strong" | "partial" | "missing" }) {
  const label = status === "strong" ? "Strong" : status === "partial" ? "Partial" : "Missing";
  const className =
    status === "strong"
      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
      : status === "partial"
        ? "bg-amber-500/15 text-amber-900 dark:text-amber-100"
        : "bg-rose-500/15 text-rose-900 dark:text-rose-100";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

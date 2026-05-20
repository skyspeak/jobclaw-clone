"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCandidateContextFromSession,
  verdictDescription,
  verdictLabel,
  type FitMatrixRow,
  type JobFitResult,
  type JobFitVerdict,
} from "@/lib/job-fit";
import { readIntakeSession } from "@/lib/intake-session";
import type { JobListing } from "@/lib/job-listings";
import { cn } from "@/lib/utils";

const JOB_FIT_JD_STORAGE_KEY = "jobclaw.job-fit.jd.v1";

function listingLabel(listing: JobListing) {
  const parts = [listing.title];
  if (listing.company.trim()) {
    parts.push(listing.company.trim());
  }
  return parts.join(" · ");
}

export function JobFitAnalyzer() {
  const searchParams = useSearchParams();
  const appliedListingRef = useRef<string | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [pasteMode, setPasteMode] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JobFitResult | null>(null);
  const [hasIntakeSession, setHasIntakeSession] = useState(false);
  const [libraryListings, setLibraryListings] = useState<JobListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState("");

  const usingUrl = Boolean(jobUrl.trim()) && !pasteMode;
  const showTextarea = !usingUrl;

  function applyLibraryListing(listing: JobListing) {
    setJobDescription(listing.description);
    setJobUrl(listing.sourceUrl.trim());
    setPasteMode(true);
    setResult(null);
    setError("");
    setSelectedListingId(listing.id);
  }

  useEffect(() => {
    const session = readIntakeSession();
    setHasIntakeSession(Boolean(session.result?.summary || session.resumeText?.trim()));
  }, []);

  useEffect(() => {
    void fetch("/api/job-listings")
      .then((response) => response.json())
      .then((payload: { listings?: JobListing[] }) => {
        setLibraryListings(payload.listings ?? []);
      })
      .catch(() => {
        setLibraryListings([]);
      });
  }, []);

  useEffect(() => {
    const listingId = searchParams.get("listing");
    if (!listingId || libraryListings.length === 0) {
      return;
    }
    if (appliedListingRef.current === listingId) {
      return;
    }
    const listing = libraryListings.find((item) => item.id === listingId);
    if (listing) {
      appliedListingRef.current = listingId;
      applyLibraryListing(listing);
    }
  }, [searchParams, libraryListings]);

  async function fetchPostingText(url: string): Promise<string> {
    const response = await fetch("/api/job-post-fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobUrl: url }),
    });
    const payload = (await response.json()) as {
      text?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not fetch that URL.");
    }

    if (!payload.text?.trim()) {
      throw new Error("Could not read enough text from that posting.");
    }

    return payload.text.trim();
  }

  async function runAnalysis(jobText: string, url?: string) {
    const session = readIntakeSession();
    const candidate = buildCandidateContextFromSession({
      resumeText: session.resumeText,
      result: session.result,
      profileDraft: session.profileDraft,
      wizardAnswers: session.wizardAnswers,
    });

    const response = await fetch("/api/job-fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription: jobText,
        jobUrl: url,
        candidate,
      }),
    });

    const payload = (await response.json()) as {
      result?: JobFitResult;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Analysis failed.");
    }

    if (!payload.result) {
      throw new Error("Analysis failed.");
    }

    setJobDescription(jobText);
    setResult(payload.result);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(JOB_FIT_JD_STORAGE_KEY, jobText);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const url = jobUrl.trim();
    let text = jobDescription.trim();

    setError("");
    setResult(null);
    setIsWorking(true);

    try {
      if (usingUrl && url) {
        text = await fetchPostingText(url);
      }

      if (text.length < 80) {
        throw new Error(
          usingUrl
            ? "Could not get enough text from that URL. Try pasting the description instead."
            : "Paste at least a few sentences of the job description.",
        );
      }

      await runAnalysis(text, url || undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsWorking(false);
    }
  }

  function switchToPaste() {
    setPasteMode(true);
    setJobUrl("");
    setError("");
  }

  function switchToUrl() {
    setPasteMode(false);
    setJobDescription("");
    setError("");
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
          Paste a job description or enter a career-page URL. We compare required skills and levels to
          your intake brief and résumé when available.
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

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
        {libraryListings.length > 0 ? (
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            <div className="space-y-2">
              <Label htmlFor="job-listing-library">Choose from library</Label>
              <select
                id="job-listing-library"
                value={selectedListingId}
                onChange={(event) => {
                  const listingId = event.target.value;
                  setSelectedListingId(listingId);
                  if (!listingId) {
                    return;
                  }
                  const listing = libraryListings.find((item) => item.id === listingId);
                  if (listing) {
                    applyLibraryListing(listing);
                  }
                }}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-sm"
                disabled={isWorking}
              >
                <option value="">Paste a URL or description…</option>
                {libraryListings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listingLabel(listing)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Listings are managed on the admin page. Selecting one fills the description below.
              </p>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            {!pasteMode ? (
              <div className="space-y-2">
                <Label htmlFor="job-url">Job posting URL</Label>
                <Input
                  id="job-url"
                  type="url"
                  placeholder="https://boards.greenhouse.io/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="h-11 rounded-xl"
                  disabled={isWorking}
                />
                <p className="text-xs text-muted-foreground">
                  Works best on Greenhouse, Lever, and company career pages. LinkedIn usually requires
                  paste.
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={switchToPaste}
                  disabled={isWorking}
                >
                  Paste description instead
                </button>
              </div>
            ) : null}

            {showTextarea ? (
              <div className="space-y-2">
                <Label htmlFor="job-description">Job description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the full job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="min-h-[200px] rounded-2xl font-mono text-sm"
                  disabled={isWorking}
                />
                {pasteMode ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={switchToUrl}
                    disabled={isWorking}
                  >
                    Use a URL instead
                  </button>
                ) : null}
              </div>
            ) : null}

            {usingUrl && isWorking ? (
              <p className="text-sm text-muted-foreground">Reading the posting and analyzing your fit…</p>
            ) : null}
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
          disabled={isWorking || (usingUrl ? !jobUrl.trim() : jobDescription.trim().length < 80)}
        >
          {isWorking ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {usingUrl ? "Analyzing…" : "Analyzing fit…"}
            </>
          ) : (
            <>
              Analyze my fit
              <ArrowRight className="size-5 opacity-90" />
            </>
          )}
        </Button>
      </form>

      {result ? <JobFitResultsCard result={result} /> : null}
    </div>
  );
}

function JobFitResultsCard({ result }: { result: JobFitResult }) {
  return (
    <section className="flex flex-col gap-6">
      <VerdictBanner verdict={result.verdict} headline={result.headline} summary={result.summary} />

      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Fit matrix
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{result.roleTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{result.seniority}</p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Criteria</th>
                <th className="pb-3 pr-4">Job post</th>
                <th className="pb-3 pr-4">Your briefing</th>
                <th className="pb-3">Fit</th>
              </tr>
            </thead>
            <tbody>
              {result.fitMatrix.map((row) => (
                <FitMatrixTableRow key={row.criteria} row={row} />
              ))}
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

      <Button
        asChild
        size="lg"
        className="cta-glow h-14 w-full rounded-2xl text-base font-semibold sm:text-lg"
      >
        <Link href="/project-sprints">
          Explore Project Pathways to enhance your skills
          <ArrowRight className="size-5 opacity-90" />
        </Link>
      </Button>
    </section>
  );
}

function FitMatrixTableRow({ row }: { row: FitMatrixRow }) {
  const status = row.status ?? "missing";

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-3 pr-4 align-top font-medium text-foreground">{row.criteria}</td>
      <td className="py-3 pr-4 align-top text-muted-foreground">{row.jobPost}</td>
      <td className="py-3 pr-4 align-top text-muted-foreground">{row.yourBriefing}</td>
      <td className="py-3 align-top">
        <StatusBadge status={status} />
      </td>
    </tr>
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

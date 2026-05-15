"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readIntakeSearchRequest } from "@/lib/intake-wizard-session";
import { readSprintSession } from "@/lib/intake-sprints";
import type { SearchRequest } from "@/lib/jobclaw";
import {
  jobHitToListing,
  readMatchedInternshipsSession,
  writeMatchedInternshipsSession,
  type MatchedInternshipListing,
} from "@/lib/matched-internships";

type ClientState =
  | { ready: false }
  | { ready: true; kind: "no-brief" }
  | { ready: true; kind: "loading" }
  | { ready: true; kind: "unconfigured"; message: string; query?: string }
  | { ready: true; kind: "error"; message: string; query?: string }
  | { ready: true; kind: "empty"; query: string }
  | {
      ready: true;
      kind: "listings";
      listings: MatchedInternshipListing[];
      query: string;
      fromBrief: boolean;
    };

function resolveSearchRequest(): SearchRequest | null {
  const cached = readMatchedInternshipsSession();
  if (cached?.searchRequest) {
    return cached.searchRequest;
  }

  return readIntakeSearchRequest() ?? readSprintSession()?.searchRequest ?? null;
}

export function MatchedInternshipsClient() {
  const [state, setState] = useState<ClientState>({ ready: false });

  useEffect(() => {
    const cached = readMatchedInternshipsSession();
    if (cached?.results.length) {
      setState({
        ready: true,
        kind: "listings",
        listings: cached.results.map(jobHitToListing),
        query: cached.query,
        fromBrief: true,
      });
    }

    const searchRequest = resolveSearchRequest();
    if (!searchRequest) {
      if (!cached?.results.length) {
        setState({ ready: true, kind: "no-brief" });
      }
      return;
    }

    const pinnedSearchRequest = searchRequest;
    let cancelled = false;

    async function loadListings() {
      if (!cached?.results.length) {
        setState({ ready: true, kind: "loading" });
      }

      try {
        const response = await fetch("/api/job-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchRequest: pinnedSearchRequest }),
        });

        const data = (await response.json()) as {
          configured?: boolean;
          message?: string;
          query?: string;
          results?: Array<{ title: string; link: string; snippet: string }>;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (data.configured === false) {
          setState({
            ready: true,
            kind: "unconfigured",
            message:
              data.message ??
              "Live job search is not configured. Add SERPER_API_KEY to your server environment.",
            query: data.query,
          });
          return;
        }

        if (!response.ok || data.error) {
          setState({
            ready: true,
            kind: "error",
            message: data.error ?? `Search returned ${response.status}.`,
            query: data.query,
          });
          return;
        }

        const results = Array.isArray(data.results) ? data.results : [];
        const query = data.query ?? "";

        if (results.length === 0) {
          setState({ ready: true, kind: "empty", query });
          return;
        }

        writeMatchedInternshipsSession({ searchRequest: pinnedSearchRequest, query, results });

        setState({
          ready: true,
          kind: "listings",
          listings: results.map(jobHitToListing),
          query,
          fromBrief: true,
        });
      } catch {
        if (!cancelled && !cached?.results.length) {
          setState({
            ready: true,
            kind: "error",
            message: "Could not reach the job search service.",
          });
        }
      }
    }

    void loadListings();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!state.ready) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        Loading matched postings…
      </div>
    );
  }

  if (state.kind === "no-brief") {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Complete your intake brief first</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page shows live postings with real application links from your brief—not placeholder listings.
        </p>
        <Button asChild className="mt-6 rounded-2xl cta-glow">
          <Link href="/intake">Start or refresh intake</Link>
        </Button>
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        Finding live postings for your brief…
      </div>
    );
  }

  if (state.kind === "unconfigured") {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-400/55 bg-amber-400/10 p-6 text-sm leading-relaxed">
        <p className="font-semibold text-foreground">Live job search is not turned on</p>
        <p className="text-muted-foreground">{state.message}</p>
        {state.query ? (
          <p className="break-words text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Query:</span> {state.query}
          </p>
        ) : null}
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/intake">Back to intake</Link>
        </Button>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-4 rounded-2xl border border-destructive/35 bg-destructive/5 p-6 text-sm text-destructive">
        <p>{state.message}</p>
        {state.query ? <p className="break-words text-xs opacity-90">Query: {state.query}</p> : null}
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/intake">Back to intake</Link>
        </Button>
      </div>
    );
  }

  if (state.kind === "empty") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-400/55 bg-amber-400/10 p-6 text-sm leading-relaxed">
          <p className="font-semibold text-foreground">No indexed listings surfaced for this brief yet</p>
          <p className="mt-2 text-muted-foreground">
            Search did not return direct posting URLs to apply on. Try project sprints while feeds catch up, or broaden
            your intake filters.
          </p>
          {state.query ? (
            <p className="mt-3 break-words text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Query:</span> {state.query}
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/project-sprints">Project sprints</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.fromBrief ? (
        <p className="text-sm text-muted-foreground">
          Live postings from your career brief. Each apply button opens the employer or board page Serper indexed—not a
          search results page.
        </p>
      ) : null}

      <ul className="grid list-none gap-5 p-0 md:grid-cols-2">
        {state.listings.map((listing) => (
          <li key={listing.id}>
            <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="space-y-2 p-7 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {listing.sourceHost}
                </p>
                <CardTitle className="text-xl leading-snug tracking-tight">{listing.title}</CardTitle>
                <CardDescription className="break-all text-xs font-normal text-muted-foreground">
                  {listing.applyUrl}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-7 pb-7 pt-0">
                {listing.summary ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{listing.summary}</p>
                ) : null}
                <Button asChild className="w-full rounded-2xl cta-glow sm:w-auto">
                  <a href={listing.applyUrl} rel="noreferrer" target="_blank">
                    Apply on their website
                  </a>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

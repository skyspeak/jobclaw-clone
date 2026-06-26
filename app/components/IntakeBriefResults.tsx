"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Share2, Target } from "lucide-react";

import { IntakeGapParametersTable } from "@/app/components/IntakeGapParametersTable";
import { IntakeVettingSourceLinks } from "@/app/components/IntakeCcAgentPanels";
import { Button } from "@/components/ui/button";
import { projectSprintPathForRoleId } from "@/lib/ai-tracks-data";
import { wizardRowsToIntakeAnswers } from "@/lib/intake-questions";
import type { SearchRequest } from "@/lib/jobclaw";
import {
  buildBriefShareText,
  buildGoogleAiModeUrl,
  clearIntakeSession,
  readIntakeSession,
  type IntakeProfileDraft,
  type IntakeWizardSession,
  writeIntakeSession,
} from "@/lib/intake-session";

export function IntakeBriefResults() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [shareNote, setShareNote] = useState("");
  const profileGenerationStarted = useRef(false);

  useEffect(() => {
    setSession(readIntakeSession());
    setHasHydrated(true);
  }, []);

  const hasBrief = Boolean(session?.result?.searchRequest);
  const vetting = session?.ccAgent.vettingResult ?? null;

  useEffect(() => {
    if (!hasHydrated || !session || hasBrief || vetting) {
      return;
    }

    router.replace("/intake");
  }, [hasBrief, hasHydrated, router, session, vetting]);

  useEffect(() => {
    if (!session?.result?.searchRequest || session.profileDraft || profileGenerationStarted.current) {
      return;
    }

    profileGenerationStarted.current = true;
    void generateProfileDraft(session);
  }, [session]);

  async function generateProfileDraft(active: IntakeWizardSession) {
    if (!active.result?.searchRequest || isGeneratingProfile) {
      return;
    }

    setIsGeneratingProfile(true);
    setProfileError("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: wizardRowsToIntakeAnswers(active.wizardAnswers),
          defaults: active.defaults,
          searchSummary: active.result.summary,
        }),
      });
      const payload = (await response.json()) as IntakeProfileDraft;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate profile draft.");
      }

      const updated = { ...active, profileDraft: payload };
      writeIntakeSession(updated);
      setSession(updated);
    } catch (caught) {
      setProfileError(
        caught instanceof Error ? caught.message : "Unable to generate profile draft.",
      );
    } finally {
      setIsGeneratingProfile(false);
    }
  }

  function handleReset() {
    clearIntakeSession();
    router.push("/intake");
  }

  async function handleShare() {
    if (!session?.result) return;

    const text = buildBriefShareText(session.profileDraft, session.result.summary);
    const url = typeof window !== "undefined" ? window.location.href : "";

    setShareNote("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My dear[CC] brief",
          text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setShareNote("Brief copied to clipboard.");
    } catch (caught) {
      if (caught instanceof Error && caught.name === "AbortError") {
        return;
      }
      setShareNote("Could not share. Try copying from the brief text.");
    }
  }

  if (!hasHydrated || !session) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading your brief…
      </p>
    );
  }

  if (!hasBrief && vetting) {
    const sprintHref = projectSprintPathForRoleId(vetting.inferredRoleId);

    return (
      <div className="flex flex-col gap-8">
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Gap analysis
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Become AI native by honing your skills
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            You completed intake vetting. Use your gap breakdown below to pick a six-week project sprint
            that builds proof-of-work for your target role.
          </p>
          <div className="mt-6 space-y-6">
            <IntakeGapParametersTable parameters={vetting.gapParameters ?? []} />
            <IntakeVettingSourceLinks
              targetJobUrl={session.targetJobUrl}
              linkedInUrl={session.linkedInUrl}
              fallbackRoleLabel={vetting.inferredRoleLabel}
            />
          </div>
        </section>

        <Button asChild size="lg" className="cta-glow h-14 w-full rounded-2xl text-base font-semibold sm:text-lg">
          <Link href={sprintHref}>
            Explore project sprints
            <ArrowRight className="size-5 opacity-90" />
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-12 w-fit rounded-2xl border-border/70 bg-card">
          <Link href="/intake">← Back to intake</Link>
        </Button>
      </div>
    );
  }

  if (!hasBrief) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading your brief…
      </p>
    );
  }

  const briefResult = session.result;
  if (!briefResult?.searchRequest) {
    return null;
  }

  const googleAiUrl = buildGoogleAiModeUrl(briefResult.searchRequest);

  return (
    <div className="flex flex-col gap-8">
      <MyBriefCard
        profile={session.profileDraft}
        summary={briefResult.summary}
        searchRequest={briefResult.searchRequest}
        isLoading={isGeneratingProfile && !session.profileDraft}
        profileError={profileError}
        onShare={() => void handleShare()}
        shareNote={shareNote}
      />

      <Button asChild size="lg" className="cta-glow h-14 w-full rounded-2xl text-base font-semibold sm:text-lg">
        <Link href="/job-fit">
          <Target className="size-5" />
          Check fit for a job posting
          <ArrowRight className="size-5 opacity-90" />
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-2xl border-border/70 bg-card"
          onClick={handleReset}
        >
          Take the quiz again
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-2xl border-border/70 bg-card">
          <a href={googleAiUrl} rel="noreferrer" target="_blank">
            Search with Google AI
          </a>
        </Button>
      </div>
    </div>
  );
}

function briefIdealRole(
  profile: IntakeProfileDraft | null,
  searchRequest: SearchRequest,
  summary: string,
) {
  if (profile?.idealJob?.title) {
    return profile.idealJob;
  }

  const title =
    searchRequest.jobTitle?.trim() ||
    searchRequest.keywords.find((keyword) => keyword.trim().length > 0)?.trim() ||
    "Early-career role";

  return {
    title,
    why:
      summary.trim() ||
      "Based on your dear[CC] intake and the roles you are exploring.",
  };
}

function briefDraftContent(
  profile: IntakeProfileDraft | null,
  searchRequest: SearchRequest,
  summary: string,
) {
  if (profile?.linkedInProfile?.headline || profile?.linkedInProfile?.about) {
    return profile.linkedInProfile;
  }

  const title = briefIdealRole(profile, searchRequest, summary).title;

  return {
    headline: `Early-career candidate exploring ${title} roles`,
    about: summary.trim() || "Your dear[CC] brief summarizes how you want to show up in conversations.",
    skills: searchRequest.keywords.filter((keyword) => keyword.trim().length > 0).slice(0, 8),
  };
}

function MyBriefCard({
  profile,
  summary,
  searchRequest,
  isLoading,
  profileError,
  onShare,
  shareNote,
}: {
  profile: IntakeProfileDraft | null;
  summary: string;
  searchRequest: SearchRequest;
  isLoading: boolean;
  profileError: string;
  onShare: () => void;
  shareNote: string;
}) {
  const idealJob = briefIdealRole(profile, searchRequest, summary);
  const draft = briefDraftContent(profile, searchRequest, summary);
  const archetypeSummary =
    profile?.archetype.summary?.trim() ||
    summary.trim() ||
    "Your brief is ready to guide your next conversations.";

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            My brief
          </p>
          {profile?.archetype.name ? (
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {profile.archetype.name}
            </h2>
          ) : (
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Your career brief
            </h2>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          disabled={isLoading && !profile}
          onClick={onShare}
        >
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      {shareNote ? <p className="mb-4 text-sm text-muted-foreground">{shareNote}</p> : null}

      {isLoading ? (
        <p className="mb-4 text-sm text-muted-foreground">Building your brief from your quiz answers…</p>
      ) : null}

      {profileError ? <p className="mb-4 text-sm text-destructive">{profileError}</p> : null}

      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{archetypeSummary}</p>

        <div className="rounded-2xl border border-border/60 bg-muted/15 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ideal role</p>
          <p className="mt-2 font-semibold text-foreground">{idealJob.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{idealJob.why}</p>
        </div>

        <div className="space-y-3 border-t border-border/50 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draft</p>
          <p className="font-semibold text-foreground">{draft.headline}</p>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{draft.about}</p>
          {draft.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {draft.skills.slice(0, 12).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Route, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { wizardRowsToIntakeAnswers } from "@/lib/intake-questions";
import {
  buildBriefShareText,
  buildGoogleAiModeUrl,
  clearIntakeSession,
  hasResumeOrLinkedInInput,
  readIntakeSession,
  type IntakeProfileDraft,
  type IntakeWizardSession,
  writeIntakeSession,
} from "@/lib/intake-session";

function readBriefSession(): IntakeWizardSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const next = readIntakeSession();
  return next.result?.searchRequest ? next : null;
}

export function IntakeBriefResults() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(readBriefSession);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [shareNote, setShareNote] = useState("");

  useEffect(() => {
    if (!session?.result?.searchRequest) {
      router.replace("/intake");
    }
  }, [session, router]);

  const showProfileActions = useMemo(() => {
    if (!session) return false;
    return hasResumeOrLinkedInInput(session.linkedInUrl, session.resumeText, session.resumeFileName);
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
          title: "My JobClaw brief",
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

  if (!session?.result?.searchRequest) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading your brief…
      </p>
    );
  }

  const googleAiUrl = buildGoogleAiModeUrl(session.result.searchRequest);

  return (
    <div className="flex flex-col gap-8">
      <MyBriefCard
        profile={session.profileDraft}
        summary={session.result.summary}
        isLoading={isGeneratingProfile && !session.profileDraft}
        profileError={profileError}
        onShare={() => void handleShare()}
        shareNote={shareNote}
      />

      <Button asChild size="lg" className="cta-glow h-14 w-full rounded-2xl text-base font-semibold sm:text-lg">
        <Link href="/ai-tracks">
          <Route className="size-5" />
          Build your own career pathway
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

      {showProfileActions ? (
        <section className="space-y-3 border-t border-border/60 pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            With your materials on file
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl"
              disabled={isGeneratingProfile}
              onClick={() => void generateProfileDraft(session)}
            >
              {isGeneratingProfile ? "Refreshing draft…" : "Draft a LinkedIn-style profile"}
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl">
              <Link href="/tailor-resume">Tailor your résumé</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MyBriefCard({
  profile,
  summary,
  isLoading,
  profileError,
  onShare,
  shareNote,
}: {
  profile: IntakeProfileDraft | null;
  summary: string;
  isLoading: boolean;
  profileError: string;
  onShare: () => void;
  shareNote: string;
}) {
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
        <p className="text-sm text-muted-foreground">Building your brief from your quiz answers…</p>
      ) : null}

      {profileError ? <p className="mb-4 text-sm text-destructive">{profileError}</p> : null}

      {profile ? (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {profile.archetype.summary}
          </p>

          <div className="rounded-2xl border border-border/60 bg-muted/15 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ideal role</p>
            <p className="mt-2 font-semibold text-foreground">{profile.idealJob.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{profile.idealJob.why}</p>
          </div>

          <div className="space-y-3 border-t border-border/50 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draft</p>
            <p className="font-semibold text-foreground">{profile.linkedInProfile.headline}</p>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {profile.linkedInProfile.about}
            </p>
            {profile.linkedInProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {profile.linkedInProfile.skills.slice(0, 12).map((skill) => (
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
      ) : !isLoading ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
      ) : null}
    </section>
  );
}

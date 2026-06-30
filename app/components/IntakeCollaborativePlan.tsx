"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mail, Sparkles } from "lucide-react";

import {
  CollaborativeRoadmapPicker,
  getMarkedNodeThemes,
} from "@/app/components/CollaborativeRoadmapPicker";
import { IntakeGetHiredConfirmationSplash } from "@/app/components/IntakeGetHiredConfirmationSplash";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestMarkedNodeIds } from "@/lib/collaborative-plan";
import { roleIdToSprintSlug } from "@/lib/intake-roadmap";
import {
  readIntakeSession,
  writeIntakeSession,
  type CollaborativePlanState,
  type IntakeWizardSession,
} from "@/lib/intake-session";
import type { NewsletterSubmitResult } from "@/lib/newsletter-signup-status";
import { splitGapParametersToBars } from "@/lib/profile-gaps";
import { getSprintRoadmapBySlug } from "@/lib/sprint-roadmap-data";
import { cn } from "@/lib/utils";

const NEWSLETTER_RESULT_KEY = "dearcc.signup-newsletter.v1";

function readSignupNewsletter(): NewsletterSubmitResult | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(NEWSLETTER_RESULT_KEY);
    return raw ? (JSON.parse(raw) as NewsletterSubmitResult) : null;
  } catch {
    return null;
  }
}

function buildInitialPlan(session: IntakeWizardSession): CollaborativePlanState {
  const vetting = session.ccAgent.vettingResult!;
  const roadmapSlug = roleIdToSprintSlug(vetting.inferredRoleId);
  const roadmap = getSprintRoadmapBySlug(roadmapSlug);

  if (session.collaborativePlan?.roadmapSlug === roadmapSlug) {
    return session.collaborativePlan;
  }

  const allNodes = roadmap ? [...roadmap.week1, ...roadmap.week2] : [];
  const markedNodeIds = suggestMarkedNodeIds(allNodes, vetting.gapParameters ?? []);

  return {
    markedNodeIds,
    customNotes: session.collaborativePlan?.customNotes ?? "",
    roadmapSlug,
  };
}

export function IntakeCollaborativePlan() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [markedNodeIds, setMarkedNodeIds] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [visible, setVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gapAnalysisSent, setGapAnalysisSent] = useState(false);
  const [newsletter, setNewsletter] = useState<NewsletterSubmitResult | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readIntakeSession();
    setSession(stored);
    setNewsletter(readSignupNewsletter());

    if (stored.ccAgent.vettingResult) {
      const initial = buildInitialPlan(stored);
      setMarkedNodeIds(initial.markedNodeIds);
      setCustomNotes(initial.customNotes);
    }

    setHasHydrated(true);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!session?.ccAgent.vettingResult) {
      router.replace("/intake");
      return;
    }
    if (!session.ccAgent.roadmapUnlocked || !session.contact.email.trim()) {
      writeIntakeSession({
        ...session,
        ccAgent: { ...session.ccAgent, flowStep: "vetting-result" },
      });
      router.replace("/intake");
      return;
    }
    if (session.collaborativePlan?.planCompletedAt) {
      router.replace("/intake/roadmap");
    }
  }, [hasHydrated, router, session]);

  const vetting = session?.ccAgent.vettingResult;
  const roadmapSlug = vetting ? roleIdToSprintSlug(vetting.inferredRoleId) : "sales";
  const roadmap = getSprintRoadmapBySlug(roadmapSlug);

  const gapLabels = useMemo(() => {
    if (!vetting) {
      return [];
    }
    const { gaps } = splitGapParametersToBars(vetting.gapParameters ?? []);
    return gaps.map((item) => item.label).slice(0, 3);
  }, [vetting]);

  const notesPlaceholder = useMemo(() => {
    if (gapLabels.length === 0) {
      return "e.g. I want more hands-on practice with AI tools before applying again…";
    }
    return `e.g. Double down on ${gapLabels.join(" and ").toLowerCase()} — I learn best by building in public…`;
  }, [gapLabels]);

  const persistPlan = useCallback(
    (nextMarked: string[], nextNotes: string) => {
      if (!session || !vetting) {
        return;
      }

      const updated: IntakeWizardSession = {
        ...session,
        collaborativePlan: {
          markedNodeIds: nextMarked,
          customNotes: nextNotes,
          roadmapSlug,
          gapAnalysisEmailedAt: session.collaborativePlan?.gapAnalysisEmailedAt,
        },
      };
      writeIntakeSession(updated);
      setSession(updated);
    },
    [roadmapSlug, session, vetting],
  );

  const scheduleSave = useCallback(
    (nextMarked: string[], nextNotes: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        persistPlan(nextMarked, nextNotes);
      }, 300);
    },
    [persistPlan],
  );

  const handleMarkedChange = useCallback(
    (ids: string[]) => {
      setMarkedNodeIds(ids);
      scheduleSave(ids, customNotes);
    },
    [customNotes, scheduleSave],
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setCustomNotes(value);
      scheduleSave(markedNodeIds, value);
    },
    [markedNodeIds, scheduleSave],
  );

  const handleNotesBlur = useCallback(() => {
    persistPlan(markedNodeIds, customNotes);
  }, [customNotes, markedNodeIds, persistPlan]);

  async function handleEmailGapAnalysis() {
    if (!session || !vetting || !roadmap) {
      return;
    }

    setIsSending(true);
    setEmailError("");

    const markedThemes = getMarkedNodeThemes(roadmap, markedNodeIds);
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}/intake` : undefined;

    try {
      const response = await fetch("/api/gap-analysis/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.contact.email.trim(),
          name: session.contact.name.trim() || null,
          gapParameters: vetting.gapParameters ?? [],
          roleLabel: vetting.inferredRoleLabel,
          targetJobUrl: session.targetJobUrl.trim() || null,
          shareUrl,
          plan: {
            markedNodeIds,
            customNotes,
            roadmapSlug,
            markedThemes,
            roadmapTitle: roadmap.title,
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send your gap analysis.");
      }

      const emailedAt = new Date().toISOString();
      const updated: IntakeWizardSession = {
        ...session,
        collaborativePlan: {
          markedNodeIds,
          customNotes,
          roadmapSlug,
          gapAnalysisEmailedAt: emailedAt,
          planCompletedAt: emailedAt,
        },
      };
      writeIntakeSession(updated);
      setSession(updated);
      setGapAnalysisSent(true);
      setShowConfirmation(true);
    } catch (caught) {
      setEmailError(caught instanceof Error ? caught.message : "Unable to send your gap analysis.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSkip() {
    const completedAt = new Date().toISOString();
    if (session && vetting) {
      const updated: IntakeWizardSession = {
        ...session,
        collaborativePlan: {
          markedNodeIds,
          customNotes,
          roadmapSlug,
          gapAnalysisEmailedAt: session.collaborativePlan?.gapAnalysisEmailedAt,
          planCompletedAt: completedAt,
        },
      };
      writeIntakeSession(updated);
      setSession(updated);
    } else {
      persistPlan(markedNodeIds, customNotes);
    }
    setShowConfirmation(true);
  }

  if (!hasHydrated || !session?.ccAgent.vettingResult || !roadmap) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading…
      </p>
    );
  }

  if (showConfirmation) {
    return (
      <IntakeGetHiredConfirmationSplash
        newsletter={newsletter}
        gapAnalysisSent={gapAnalysisSent}
        email={session.contact.email.trim()}
        markedCount={markedNodeIds.length}
      />
    );
  }

  const markedLabel =
    markedNodeIds.length === 1
      ? "1 area marked"
      : `${markedNodeIds.length} areas marked`;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-1 flex-col transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <section className="relative overflow-hidden rounded-3xl border border-[#2D6A4F]/20 bg-gradient-to-b from-[#2D6A4F]/10 via-card/95 to-[#D4A574]/10 px-5 py-6 shadow-sm backdrop-blur-sm sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-[#2D6A4F]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-12 bottom-0 size-40 rounded-full bg-[#D4A574]/15 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6A4F]">
            Step 2 · Your plan
          </p>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-1 size-4 shrink-0 text-[#D4A574]" aria-hidden />
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Let&apos;s shape your path together
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Pin the sprint days that matter most for closing your gaps — DearCC will co-build
                your plan around what you mark.
              </p>
            </div>
          </div>
        </div>
      </section>

      {gapLabels.length > 0 ? (
        <section className="mt-4 flex flex-wrap gap-2">
          {gapLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[#C05621]/30 bg-[#C05621]/8 px-3 py-1 text-xs font-medium text-[#C05621]"
            >
              Gap: {label}
            </span>
          ))}
        </section>
      ) : null}

      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{roadmap.title} sprint roadmap</p>
            <p className="text-xs text-muted-foreground">{roadmap.subtitle}</p>
          </div>
          <span className="rounded-full border border-[#2D6A4F]/25 bg-[#2D6A4F]/8 px-3 py-1 text-xs font-semibold text-[#2D6A4F]">
            {markedLabel}
          </span>
        </div>

        <CollaborativeRoadmapPicker
          roadmap={roadmap}
          markedNodeIds={markedNodeIds}
          onMarkedNodeIdsChange={handleMarkedChange}
        />
      </section>

      <section className="mt-6 space-y-2">
        <Label htmlFor="collab-plan-notes">Anything else you want to focus on?</Label>
        <Textarea
          id="collab-plan-notes"
          value={customNotes}
          onChange={(event) => handleNotesChange(event.target.value)}
          onBlur={handleNotesBlur}
          placeholder={notesPlaceholder}
          rows={4}
          className="min-h-[120px] rounded-xl border-border/70 bg-card/80 text-base backdrop-blur-sm sm:text-sm"
        />
      </section>

      {emailError ? (
        <p className="mt-4 text-sm font-medium text-destructive" role="alert">
          {emailError}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-auto space-y-3 pt-6",
          "sticky bottom-0 -mx-3 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-3 pb-[max(0px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pb-0 sm:backdrop-blur-none",
        )}
      >
        <Button
          type="button"
          disabled={isSending}
          onClick={() => void handleEmailGapAnalysis()}
          className="cta-glow h-12 min-h-12 w-full touch-manipulation rounded-2xl text-base font-semibold"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Mail className="mr-2 size-4" />
              Email me my gap analysis
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={isSending}
          onClick={handleSkip}
          className="min-h-11 w-full touch-manipulation rounded-xl text-muted-foreground"
        >
          Skip for now
        </Button>

        <Button asChild variant="ghost" className="min-h-11 w-full touch-manipulation rounded-xl text-muted-foreground">
          <Link href="/intake">← Back to your analysis</Link>
        </Button>
      </div>
    </div>
  );
}

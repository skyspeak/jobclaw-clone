"use client";

import Link from "next/link";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, Bot, Loader2, Send } from "lucide-react";

import {
  IntakeHookPanel,
  IntakeNurtureTrackPanel,
  IntakeResumePanel,
  IntakeRoleSuggestionsPanel,
  IntakeTargetJobPanel,
  IntakeVettingResultPanel,
} from "@/app/components/IntakeCcAgentPanels";
import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakePrefsFields } from "@/app/components/IntakePrefsFields";
import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { getFlowStepSequence } from "@/lib/cc-agent-flow";
import { QUESTIONS, type PrefsValues } from "@/lib/intake-questions";
import type { ParsedProfileInsight } from "@/lib/profile-parse";
import { cn } from "@/lib/utils";

type ChatIntakeConversationProps = {
  flowStep: CcAgentStepId;
  progressStep: number;
  totalSteps: number;
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
  onTargetJobUrlChange: (value: string) => void;
  onKnowsTargetJobChange: (knows: boolean) => void;
  onUsWorkEligibleChange: (value: boolean) => void;
  onSelectRole: (roleId: string) => void;
  currentAnswer: string;
  onCurrentAnswerChange: (value: string) => void;
  answerError: string;
  prefsForm: UseFormReturn<PrefsValues>;
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeText: string;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
  profileInsight: ParsedProfileInsight | null;
  wizardAnswers: string[];
  quizIndex: number;
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isParsingProfile: boolean;
  isRunningTriage: boolean;
};

type ChatTurn =
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "assistant"; kind: "hook" }
  | { id: string; role: "assistant"; kind: "target-job" }
  | { id: string; role: "assistant"; kind: "resume" }
  | { id: string; role: "assistant"; kind: "linkedin" }
  | { id: string; role: "assistant"; kind: "question"; step: number }
  | { id: string; role: "user"; kind: "answer"; step: number; content: string }
  | { id: string; role: "assistant"; kind: "role-suggestions" }
  | { id: string; role: "assistant"; kind: "vetting" }
  | { id: string; role: "assistant"; kind: "nurture" }
  | { id: string; role: "assistant"; kind: "prefs" };

function stepReached(
  sequence: CcAgentStepId[],
  current: CcAgentStepId,
  target: CcAgentStepId,
): boolean {
  const currentIndex = sequence.indexOf(current);
  const targetIndex = sequence.indexOf(target);
  if (currentIndex < 0 || targetIndex < 0) {
    return false;
  }
  return currentIndex >= targetIndex;
}

function buildTurns(
  wizardAnswers: string[],
  flowStep: CcAgentStepId,
  knowsTargetJob: boolean | null,
  quizIndex: number,
): ChatTurn[] {
  const sequence = getFlowStepSequence(knowsTargetJob);
  const turns: ChatTurn[] = [
    {
      id: "welcome",
      role: "assistant",
      kind: "welcome",
    },
  ];

  if (stepReached(sequence, flowStep, "hook")) {
    turns.push({ id: "hook", role: "assistant", kind: "hook" });
  }

  if (knowsTargetJob === true && stepReached(sequence, flowStep, "target-job-url")) {
    turns.push({ id: "target-job", role: "assistant", kind: "target-job" });
  }

  if (stepReached(sequence, flowStep, "resume")) {
    turns.push({ id: "resume", role: "assistant", kind: "resume" });
  }

  if (knowsTargetJob === false && stepReached(sequence, flowStep, "quiz")) {
    for (let i = 0; i < 5; i++) {
      const answered = Boolean(wizardAnswers[i]?.trim());
      const isPast = i < quizIndex || (flowStep !== "quiz" && stepReached(sequence, flowStep, "role-suggestions"));
      const isCurrent = flowStep === "quiz" && i === quizIndex;

      if (!answered && !isCurrent && i > quizIndex && flowStep === "quiz") {
        break;
      }

      turns.push({ id: `q-${i}`, role: "assistant", kind: "question", step: i });

      if (answered && (isPast || isCurrent)) {
        turns.push({
          id: `a-${i}`,
          role: "user",
          kind: "answer",
          step: i,
          content: wizardAnswers[i],
        });
      } else if (isCurrent && !answered) {
        break;
      }
    }
  }

  if (stepReached(sequence, flowStep, "role-suggestions")) {
    turns.push({ id: "role-suggestions", role: "assistant", kind: "role-suggestions" });
  }

  if (stepReached(sequence, flowStep, "linkedin") && sequence.includes("linkedin")) {
    turns.push({ id: "linkedin", role: "assistant", kind: "linkedin" });
  }

  if (stepReached(sequence, flowStep, "vetting-result")) {
    turns.push({ id: "vetting", role: "assistant", kind: "vetting" });
  }

  if (stepReached(sequence, flowStep, "nurture-track")) {
    turns.push({ id: "nurture", role: "assistant", kind: "nurture" });
  }

  if (stepReached(sequence, flowStep, "search-filters")) {
    turns.push({ id: "prefs", role: "assistant", kind: "prefs" });
  }

  return turns;
}

function BotAvatar({ className, highlighted }: { className?: string; highlighted?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
        highlighted
          ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
          : "border-primary/20 bg-primary/10 text-primary",
        className,
      )}
      aria-hidden
    >
      <Bot className="h-4 w-4" strokeWidth={2} />
    </div>
  );
}

function AssistantBubble({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "welcome";
}) {
  const isWelcome = variant === "welcome";

  return (
    <div className={cn("flex gap-3", className)}>
      <BotAvatar highlighted={isWelcome} />
      <div className="min-w-0 max-w-[min(100%,36rem)] flex-1 space-y-1">
        <p
          className={cn(
            "text-xs font-semibold tracking-wide",
            isWelcome ? "text-primary" : "text-muted-foreground",
          )}
        >
          CC Agent
        </p>
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-relaxed shadow-sm sm:text-base",
            isWelcome
              ? "border-primary/30 bg-secondary text-secondary-foreground"
              : "border-border/70 bg-card text-foreground",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[min(100%,28rem)] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm sm:text-base">
        {children}
      </div>
    </div>
  );
}

export function ChatIntakeConversation({
  flowStep,
  progressStep,
  totalSteps,
  ccAgent,
  targetJobUrl,
  onTargetJobUrlChange,
  onKnowsTargetJobChange,
  onUsWorkEligibleChange,
  onSelectRole,
  currentAnswer,
  onCurrentAnswerChange,
  answerError,
  prefsForm,
  linkedInUrl,
  onLinkedInUrlChange,
  resumeText,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  profileCompleteForGenerate,
  profileIncompleteHint,
  profileInsight,
  wizardAnswers,
  quizIndex,
  onBack,
  onNext,
  onGenerate,
  isGenerating,
  isParsingProfile,
  isRunningTriage,
}: ChatIntakeConversationProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const currentQuestion = flowStep === "quiz" ? QUESTIONS[quizIndex] : null;
  const turns = useMemo(
    () => buildTurns(wizardAnswers, flowStep, ccAgent.knowsTargetJob, quizIndex),
    [wizardAnswers, flowStep, ccAgent.knowsTargetJob, quizIndex],
  );

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, flowStep, currentAnswer]);

  function handleSendAnswer() {
    if (flowStep !== "quiz" || !currentAnswer.trim()) {
      return;
    }
    onNext();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (currentAnswer.trim()) {
        handleSendAnswer();
      }
    }
  }

  const showQuestionComposer = flowStep === "quiz" && currentQuestion;
  const isBusy = isGenerating || isParsingProfile || isRunningTriage;

  return (
    <div className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
      <header className="shrink-0 border-b border-border/60 bg-background/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground sm:text-sm">
            <Link className="tracking-wide text-foreground underline-offset-4 hover:underline" href="/">
              JOBCLAW
            </Link>
            <span>
              Step {progressStep} of {totalSteps}
            </span>
          </div>
          <Progress value={(progressStep / totalSteps) * 100} className="h-1.5 sm:h-2" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link
              href="/"
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Home
            </Link>
            <Link
              href="/intake/form"
              className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Switch to step-by-step form
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {turns.map((turn) => {
            if (turn.kind === "welcome") {
              return (
                <AssistantBubble key={turn.id} variant="welcome">
                  <p>
                    Hi — I&apos;m CC Agent. We&apos;ll triage your target, vet your profile, and route you into the
                    right nurture track toward proof-of-work and your first offer.
                  </p>
                </AssistantBubble>
              );
            }

            if (turn.kind === "hook") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Do you know what job you want?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If yes, paste a target job URL next. If not, we&apos;ll use your résumé and a short quiz to suggest
                    roles.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeHookPanel
                      knowsTargetJob={ccAgent.knowsTargetJob}
                      onKnowsTargetJobChange={onKnowsTargetJobChange}
                      usWorkEligible={ccAgent.usWorkEligible}
                      onUsWorkEligibleChange={onUsWorkEligibleChange}
                    />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "target-job") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Paste your target job</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We&apos;ll parse the posting to build a required-skill vector for gap analysis.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeTargetJobPanel
                      targetJobUrl={targetJobUrl}
                      onTargetJobUrlChange={onTargetJobUrlChange}
                    />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "resume") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Upload your résumé</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We parse it for your skill graph and vetting signals.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeResumePanel
                      linkedInUrl={linkedInUrl}
                      onLinkedInUrlChange={onLinkedInUrlChange}
                      resumeFileName={resumeFileName}
                      resumeText={resumeText}
                      onResumeFile={onResumeFile}
                      isReadingResume={isReadingResume}
                      profileCompleteForGenerate={Boolean(resumeText.trim() || resumeFileName)}
                      profileIncompleteHint="Upload a text-based résumé to continue."
                      showLinkedIn={false}
                    />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "linkedin") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">LinkedIn profile</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Used for location, network strength, and verification alongside your résumé.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeResumePanel
                      linkedInUrl={linkedInUrl}
                      onLinkedInUrlChange={onLinkedInUrlChange}
                      resumeFileName={resumeFileName}
                      resumeText={resumeText}
                      onResumeFile={onResumeFile}
                      isReadingResume={isReadingResume}
                      profileCompleteForGenerate={profileCompleteForGenerate}
                      profileIncompleteHint={profileIncompleteHint}
                      showLinkedIn
                    />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "question") {
              const q = QUESTIONS[turn.step];
              return (
                <AssistantBubble key={turn.id}>
                  <p className="font-medium">{q.prompt}</p>
                  {q.hint ? <p className="mt-2 text-sm text-muted-foreground">{q.hint}</p> : null}
                </AssistantBubble>
              );
            }

            if (turn.kind === "answer") {
              return <UserBubble key={turn.id}>{turn.content}</UserBubble>;
            }

            if (turn.kind === "role-suggestions") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Suggested roles</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick the closest MVP vetted role. We&apos;ll run the Samantha filter next.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeRoleSuggestionsPanel
                      roleSuggestions={ccAgent.roleSuggestions}
                      selectedRoleId={ccAgent.selectedRoleId}
                      onSelectRole={onSelectRole}
                    />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "vetting" && ccAgent.vettingResult) {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Vetting results</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Both tracks continue; vetted status unlocks mentorship after your team sprint.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeVettingResultPanel vetting={ccAgent.vettingResult} />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "nurture" && ccAgent.vettingResult) {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Your nurture track</p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeNurtureTrackPanel trackId={ccAgent.vettingResult.nurtureTrack} />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "prefs") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Almost there — any search filters?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profileInsight?.filtersIntro ??
                      "Optional preferences to narrow down roles. Skip anything that doesn't matter."}
                  </p>
                  {profileInsight?.suggestedRoles?.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Example roles: {profileInsight.suggestedRoles.join(" · ")}
                    </p>
                  ) : null}
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakePrefsFields prefsForm={prefsForm} isGenerating={isGenerating} compact />
                  </div>
                </AssistantBubble>
              );
            }

            return null;
          })}
          <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
          {showQuestionComposer ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg shadow-black/5 backdrop-blur-sm sm:p-4">
                <IntakeOptionChips
                  options={currentQuestion.options}
                  value={currentAnswer}
                  onChange={onCurrentAnswerChange}
                  stepIndex={quizIndex}
                />
              </div>

              <div className="flex items-end gap-2">
                <VoiceTextarea
                  key={`chat-q-${quizIndex}`}
                  placeholder="Type or speak your answer…"
                  data-testid={`textarea-q${quizIndex + 1}`}
                  value={currentAnswer}
                  onValueChange={onCurrentAnswerChange}
                  onKeyDown={handleComposerKeyDown}
                  micDisabled={isGenerating}
                  micLabel="Speak your answer"
                  className="min-h-[52px] max-h-32 py-3 pl-4 pr-14 text-base sm:min-h-[56px]"
                  wrapperClassName="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendAnswer}
                  disabled={isBusy || !currentAnswer.trim()}
                  className="h-12 w-12 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                  aria-label="Send answer"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              {answerError ? <p className="text-sm font-medium text-destructive">{answerError}</p> : null}

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isBusy}
                  className="h-11 rounded-2xl px-4"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={flowStep === "hook" || isBusy}
                className="h-12 rounded-2xl px-5"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>

              {flowStep !== "search-filters" ? (
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={isBusy}
                  className="cta-glow h-12 flex-1 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none sm:px-8"
                  data-testid="button-next"
                >
                  {isRunningTriage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running vetting…
                    </>
                  ) : isParsingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing profile…
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onGenerate}
                  disabled={isBusy || !profileCompleteForGenerate}
                  className="cta-glow h-12 flex-1 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90 sm:px-8"
                  data-testid="button-submit"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      Generate Brief <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot } from "lucide-react";

import {
  IntakeJourneyPanel,
  IntakeVettingResultPanel,
} from "@/app/components/IntakeCcAgentPanels";
import { IntakeChatComposer } from "@/app/components/IntakeChatComposer";
import { IntakeRoadmapFullView } from "@/app/components/IntakeRoadmapFullView";
import { IntakeStepNav } from "@/app/components/IntakeStepNav";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { isQuizPath, QUIZ_PATH_INTRO } from "@/lib/cc-agent-flow";
import { buildTranscript, getActiveStepPrompt } from "@/lib/cc-agent-transcript";
import { QUESTIONS, type PrefsValues } from "@/lib/intake-questions";
import type { ParsedProfileInsight } from "@/lib/profile-parse";
import { cn } from "@/lib/utils";

type ChatIntakeConversationProps = {
  flowStep: CcAgentStepId;
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
  onTargetJobUrlChange: (value: string) => void;
  onNoDreamJob: () => void;
  onSelectRole: (roleId: string) => void;
  onSkipProfileUpload: () => void;
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
  onTopLevelStepClick: (topLevel: 1 | 2 | 3) => void;
  onNext: () => void;
  onUnlockRoadmap?: () => void;
  onUnlockRoadmapSubmit?: () => void;
  unlockEmail?: string;
  onUnlockEmailChange?: (value: string) => void;
  unlockContactConsent?: boolean;
  onUnlockContactConsentChange?: (value: boolean) => void;
  unlockError?: string;
  gapEmailSummary?: string;
  isUnlockingRoadmap?: boolean;
  roadmapContactEmail?: string;
  roadmapContactName?: string;
  roadmapContactPhone?: string;
  onRoadmapContactUpdate?: (patch: { name?: string; phone?: string }) => void;
  onQuit?: () => void;
  isGenerating: boolean;
  isParsingProfile: boolean;
  isRunningTriage: boolean;
  globalError?: string;
};

function BotAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary",
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
  hideLabel,
  className,
  wide,
  bare,
}: {
  children: ReactNode;
  hideLabel?: boolean;
  className?: string;
  wide?: boolean;
  bare?: boolean;
}) {
  return (
    <div className={cn("flex gap-3 py-1.5", className)}>
      <BotAvatar className="mt-0.5" />
      <div className={cn("min-w-0 flex-1", wide ? "max-w-full" : "max-w-[min(100%,36rem)]")}>
        {!hideLabel ? (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{BRAND_NAME}</p>
        ) : null}
        {bare ? (
          <div className="text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">{children}</div>
        ) : (
          <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card px-3 py-3 text-sm leading-relaxed text-foreground shadow-sm sm:px-4 sm:text-[0.9375rem]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({
  children,
  pending = false,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <div className="flex justify-end py-1.5 pl-8 sm:pl-16">
      <div
        className={cn(
          "max-w-[min(100%,28rem)] rounded-2xl rounded-br-md px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:px-4 sm:text-[0.9375rem]",
          pending
            ? "border border-dashed border-primary/35 bg-primary/[0.07] text-foreground"
            : "border border-primary/25 bg-primary/15 text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <AssistantBubble>
      <div className="flex items-center gap-1 py-1" aria-label="Typing">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="inline-block h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </AssistantBubble>
  );
}

const TYPING_DELAY_MS = 1000;

const FIRST_STEPS: CcAgentStepId[] = ["linkedin", "target-job-url"];

export function ChatIntakeConversation({
  flowStep,
  ccAgent,
  targetJobUrl,
  onTargetJobUrlChange,
  onNoDreamJob,
  onSelectRole,
  onSkipProfileUpload,
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
  onTopLevelStepClick,
  onNext,
  onUnlockRoadmap,
  onUnlockRoadmapSubmit,
  unlockEmail = "",
  onUnlockEmailChange,
  unlockContactConsent = false,
  onUnlockContactConsentChange,
  unlockError,
  gapEmailSummary = "",
  isUnlockingRoadmap = false,
  roadmapContactEmail = "",
  roadmapContactName = "",
  roadmapContactPhone = "",
  onRoadmapContactUpdate,
  onQuit,
  isGenerating,
  isParsingProfile,
  isRunningTriage,
  globalError,
}: ChatIntakeConversationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isBusy = isGenerating || isParsingProfile || isRunningTriage || isUnlockingRoadmap;
  const isVettingResult = flowStep === "vetting-result";
  const isRoadmap = flowStep === "roadmap";
  const isJourney = flowStep === "journey";
  const canGoBack = !FIRST_STEPS.includes(flowStep) && !isBusy && !isRoadmap;
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    setPromptReady(false);
    const timer = window.setTimeout(() => setPromptReady(true), TYPING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [flowStep, quizIndex]);

  const transcript = useMemo(
    () =>
      buildTranscript({
        flowStep,
        ccAgent,
        targetJobUrl,
        linkedInUrl,
        resumeFileName,
        resumeText,
        wizardAnswers,
        quizIndex,
      }),
    [flowStep, ccAgent, targetJobUrl, linkedInUrl, resumeFileName, resumeText, wizardAnswers, quizIndex],
  );

  const activePrompt = useMemo(() => {
    if (flowStep === "quiz") {
      const q = QUESTIONS[quizIndex];
      if (isQuizPath(ccAgent) && quizIndex === 0) {
        return {
          title: QUIZ_PATH_INTRO,
          body: [q.prompt, q.hint].filter(Boolean).join("\n\n"),
        };
      }
      return { title: q.prompt, body: q.hint };
    }
    return getActiveStepPrompt(flowStep, profileInsight?.filtersIntro, quizIndex, ccAgent);
  }, [flowStep, quizIndex, profileInsight?.filtersIntro, ccAgent]);

  const showActivePrompt =
    promptReady &&
    activePrompt.title &&
    !isVettingResult &&
    !isJourney &&
    !isRoadmap;

  const scrollToLatest = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToLatest());
    return () => cancelAnimationFrame(frame);
  }, [
    transcript.length,
    flowStep,
    isBusy,
    quizIndex,
    promptReady,
    scrollToLatest,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-md pt-[max(0px,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-3 py-2 sm:gap-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-1">
            {canGoBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                disabled={isBusy}
                className="size-9 shrink-0 touch-manipulation rounded-lg text-muted-foreground"
                data-testid="button-back"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="size-9 shrink-0" aria-hidden />
            )}
            <Link
              className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
              href="/"
            >
              {BRAND_NAME}
            </Link>
          </div>
          <IntakeStepNav
            flowStep={flowStep}
            ccAgent={ccAgent}
            onStepClick={onTopLevelStepClick}
          />
        </div>
      </header>

      {isRoadmap ? (
        <IntakeRoadmapFullView
          roadmap={ccAgent.personalizedRoadmap}
          vetting={ccAgent.vettingResult}
          roleLabel={ccAgent.vettingResult?.inferredRoleLabel ?? "your target role"}
          gapSummary={gapEmailSummary}
          email={roadmapContactEmail}
          contactName={roadmapContactName}
          contactPhone={roadmapContactPhone}
          onContactUpdate={onRoadmapContactUpdate}
          isLoading={isUnlockingRoadmap}
          error={unlockError}
          className="flex-1"
        />
      ) : (
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto w-full max-w-2xl space-y-0.5 px-3 py-4 sm:px-6 sm:py-5">
          {!promptReady && !isVettingResult && !isJourney ? <TypingIndicator /> : null}

          {promptReady
            ? transcript.map((message) =>
                message.role === "assistant" ? (
                  <AssistantBubble key={message.id} hideLabel={Boolean(message.headline)}>
                    {message.headline ? (
                      <>
                        <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                          {message.headline}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                          {message.content}
                        </p>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </AssistantBubble>
                ) : (
                  <UserBubble key={message.id} pending={message.pending}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </UserBubble>
                ),
              )
            : null}

          {showActivePrompt ? (
            <AssistantBubble>
              <p
                className={cn(
                  flowStep === "linkedin"
                    ? "text-base font-semibold tracking-tight text-foreground sm:text-lg"
                    : "font-medium",
                )}
              >
                {activePrompt.title}
              </p>
              {activePrompt.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {activePrompt.body}
                </p>
              ) : null}
            </AssistantBubble>
          ) : null}

          {isBusy ? <TypingIndicator /> : null}

          {isVettingResult && ccAgent.vettingResult ? (
            <>
              <AssistantBubble wide hideLabel>
                <p className="font-medium">{getActiveStepPrompt("vetting-result").title}</p>
                {getActiveStepPrompt("vetting-result").body ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getActiveStepPrompt("vetting-result").body}
                  </p>
                ) : null}
              </AssistantBubble>
              <AssistantBubble wide bare hideLabel>
                <IntakeVettingResultPanel
                  vetting={ccAgent.vettingResult}
                  targetJobUrl={targetJobUrl}
                  linkedInUrl={linkedInUrl}
                  resumeFileName={resumeFileName}
                />
              </AssistantBubble>
              <AssistantBubble>
                <p className="text-sm text-muted-foreground">
                  Your personalized 6-week roadmap is ready. Enter your email below to unlock it.
                </p>
              </AssistantBubble>
            </>
          ) : null}

          {isJourney && ccAgent.vettingResult ? (
            <AssistantBubble wide bare hideLabel>
              <IntakeJourneyPanel vetting={ccAgent.vettingResult} />
            </AssistantBubble>
          ) : null}
        </div>
      </div>
      )}

      {!isRoadmap ? (
      <footer className="sticky bottom-0 z-30 shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {answerError || globalError || unlockError ? (
          <p
            className="mx-auto w-full max-w-2xl px-3 pb-1 pt-2 text-sm font-medium text-destructive sm:px-6"
            role="alert"
          >
            {answerError || globalError || unlockError}
          </p>
        ) : null}
        <IntakeChatComposer
          flowStep={flowStep}
          ccAgent={ccAgent}
          targetJobUrl={targetJobUrl}
          onTargetJobUrlChange={onTargetJobUrlChange}
          onNoDreamJob={onNoDreamJob}
          onSelectRole={onSelectRole}
          onSkipProfileUpload={onSkipProfileUpload}
          currentAnswer={currentAnswer}
          onCurrentAnswerChange={onCurrentAnswerChange}
          answerError={answerError}
          linkedInUrl={linkedInUrl}
          onLinkedInUrlChange={onLinkedInUrlChange}
          resumeText={resumeText}
          resumeFileName={resumeFileName}
          onResumeFile={onResumeFile}
          isReadingResume={isReadingResume}
          profileCompleteForGenerate={profileCompleteForGenerate}
          profileIncompleteHint={profileIncompleteHint}
          quizIndex={quizIndex}
          onNext={onNext}
          onUnlockRoadmap={onUnlockRoadmap}
          onUnlockRoadmapSubmit={onUnlockRoadmapSubmit}
          unlockEmail={unlockEmail}
          onUnlockEmailChange={onUnlockEmailChange}
          unlockContactConsent={unlockContactConsent}
          onUnlockContactConsentChange={onUnlockContactConsentChange}
          unlockError={unlockError}
          gapEmailSummary={gapEmailSummary}
          isUnlockingRoadmap={isUnlockingRoadmap}
          onQuit={onQuit}
          onBack={onBack}
          isBusy={isBusy}
          showAnswerError={false}
          variant="chat"
        />
      </footer>
      ) : null}
    </div>
  );
}

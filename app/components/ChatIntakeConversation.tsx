"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, ChevronDown, Loader2 } from "lucide-react";

import { IntakeChatComposer } from "@/app/components/IntakeChatComposer";
import { IntakeStepNav } from "@/app/components/IntakeStepNav";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { isQuizPath, QUIZ_PATH_INTRO } from "@/lib/cc-agent-flow";
import { buildLiveUserInputs, buildTranscript, getActiveStepPrompt } from "@/lib/cc-agent-transcript";
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
  onGetHired?: () => void;
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
}: {
  children: ReactNode;
  hideLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <BotAvatar className="mt-0.5" />
      <div className="min-w-0 max-w-[min(100%,36rem)] flex-1">
        {!hideLabel ? (
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{BRAND_NAME}</p>
        ) : null}
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card px-3 py-3 text-sm leading-relaxed text-foreground shadow-sm sm:px-4 sm:text-[0.9375rem]">
          {children}
        </div>
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
    <div className="flex justify-end py-2 pl-6 sm:pl-16">
      <div
        className={cn(
          "max-w-[min(100%,28rem)] rounded-2xl rounded-br-md px-3 py-3 text-sm leading-relaxed shadow-sm sm:px-4 sm:text-[0.9375rem]",
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Thinking…</span>
      </div>
    </AssistantBubble>
  );
}

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
  onGetHired,
  onQuit,
  isGenerating,
  isParsingProfile,
  isRunningTriage,
  globalError,
}: ChatIntakeConversationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isBusy = isGenerating || isParsingProfile || isRunningTriage;
  const isAnalysisStep = flowStep === "vetting-result" || flowStep === "journey";
  const [mobileTranscriptOpen, setMobileTranscriptOpen] = useState(false);

  useEffect(() => {
    if (!isAnalysisStep) {
      setMobileTranscriptOpen(false);
    }
  }, [isAnalysisStep, flowStep]);

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

  const liveUserInputs = useMemo(
    () =>
      buildLiveUserInputs({
        flowStep,
        ccAgent,
        targetJobUrl,
        linkedInUrl,
        resumeFileName,
        resumeText,
        currentAnswer,
      }),
    [flowStep, ccAgent, targetJobUrl, linkedInUrl, resumeFileName, resumeText, currentAnswer],
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
  }, [transcript.length, liveUserInputs.length, flowStep, isBusy, quizIndex, scrollToLatest]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background selection:bg-primary selection:text-primary-foreground max-sm:overflow-y-auto sm:overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-md pt-[max(0px,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <Link
            className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
            href="/"
          >
            {BRAND_NAME}
          </Link>
          <IntakeStepNav
            flowStep={flowStep}
            ccAgent={ccAgent}
            onStepClick={onTopLevelStepClick}
          />
        </div>
      </header>

      {isAnalysisStep ? (
        <button
          type="button"
          className="mx-auto flex min-h-11 w-full max-w-2xl shrink-0 touch-manipulation items-center justify-between border-b border-border/50 px-3 py-2 text-sm font-medium text-muted-foreground sm:hidden"
          onClick={() => setMobileTranscriptOpen((open) => !open)}
          aria-expanded={mobileTranscriptOpen}
        >
          {mobileTranscriptOpen ? "Hide conversation" : "View conversation"}
          <ChevronDown
            className={cn("size-4 transition-transform", mobileTranscriptOpen && "rotate-180")}
            aria-hidden
          />
        </button>
      ) : null}

      <div
        ref={scrollContainerRef}
        className={cn(
          "min-h-0 overscroll-contain",
          isAnalysisStep
            ? cn(
                "sm:max-h-[min(18dvh,10rem)] sm:shrink-0 sm:overflow-y-auto",
                mobileTranscriptOpen
                  ? "max-sm:max-h-[min(32dvh,16rem)] max-sm:shrink-0 max-sm:overflow-y-auto"
                  : "max-sm:max-h-0 max-sm:overflow-hidden",
              )
            : "flex-1 overflow-y-auto max-sm:flex-none max-sm:overflow-visible",
        )}
      >
        <div className="mx-auto w-full max-w-2xl space-y-1 px-3 py-4 sm:px-6 sm:py-6">
          {transcript.map((message) =>
            message.role === "assistant" ? (
              <AssistantBubble key={message.id} hideLabel={Boolean(message.headline)}>
                {message.headline ? (
                  <>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
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
          )}

          {activePrompt.title && flowStep !== "vetting-result" && flowStep !== "journey" ? (
            <AssistantBubble>
              <p className="font-medium">{activePrompt.title}</p>
              {activePrompt.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{activePrompt.body}</p>
              ) : null}
            </AssistantBubble>
          ) : null}

          {liveUserInputs.map((message) => (
            <UserBubble key={message.id} pending>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </UserBubble>
          ))}

          {isBusy ? <TypingIndicator /> : null}
        </div>
      </div>

      <div
        className={cn(
          "z-20 flex shrink-0 flex-col border-t border-border/60 bg-background/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          flowStep === "vetting-result"
            ? "min-h-0 max-sm:flex-1 sm:max-h-[min(78dvh,780px)]"
            : flowStep === "journey"
              ? "min-h-0 max-sm:flex-1 sm:max-h-[min(72dvh,700px)]"
              : "max-sm:max-h-none sm:max-h-[min(58dvh,560px)]",
        )}
      >
        <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center px-3 pt-1.5 sm:px-6 sm:pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={flowStep === "connect" || flowStep === "target-job-url" || isBusy}
            className="min-h-11 touch-manipulation rounded-lg px-2 text-muted-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
        {answerError || globalError ? (
          <p
            className="mx-auto w-full max-w-2xl shrink-0 px-3 pb-1 text-sm font-medium text-destructive sm:px-6"
            role="alert"
          >
            {answerError || globalError}
          </p>
        ) : null}
        <div
          className={cn(
            "flex flex-col overscroll-contain",
            isAnalysisStep ? "min-h-0 flex-1 overflow-hidden" : "max-sm:overflow-visible",
          )}
        >
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
          onGetHired={onGetHired}
          onQuit={onQuit}
          isBusy={isBusy}
          showAnswerError={false}
        />
        </div>
      </div>
    </div>
  );
}

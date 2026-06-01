"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";

import { IntakeChatComposer } from "@/app/components/IntakeChatComposer";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { buildTranscript, getActiveStepPrompt } from "@/lib/cc-agent-transcript";
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
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 py-1", className)}>
      <BotAvatar />
      <div className="min-w-0 max-w-[min(100%,36rem)] flex-1">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{BRAND_NAME}</p>
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm sm:text-[0.9375rem]">
          {children}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end py-1">
      <div className="max-w-[min(100%,28rem)] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm sm:text-[0.9375rem]">
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
  const isBusy = isGenerating || isParsingProfile || isRunningTriage;

  const transcript = useMemo(
    () =>
      buildTranscript({
        flowStep,
        ccAgent,
        targetJobUrl,
        resumeFileName,
        wizardAnswers,
        quizIndex,
      }),
    [flowStep, ccAgent, targetJobUrl, resumeFileName, wizardAnswers, quizIndex],
  );

  const activePrompt = useMemo(() => {
    if (flowStep === "quiz") {
      const q = QUESTIONS[quizIndex];
      return { title: q.prompt, body: q.hint };
    }
    return getActiveStepPrompt(flowStep, profileInsight?.filtersIntro);
  }, [flowStep, quizIndex, profileInsight?.filtersIntro]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, flowStep, currentAnswer, isBusy]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
            href="/"
          >
            {BRAND_NAME}
          </Link>
          <span className="text-xs text-muted-foreground">
            {progressStep} / {totalSteps}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
          {transcript.map((message) =>
            message.role === "assistant" ? (
              <AssistantBubble key={message.id}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </AssistantBubble>
            ) : (
              <UserBubble key={message.id}>{message.content}</UserBubble>
            ),
          )}

          {activePrompt.title ? (
            <AssistantBubble>
              <p className="font-medium">{activePrompt.title}</p>
              {activePrompt.body ? (
                <p className="mt-2 text-sm text-muted-foreground">{activePrompt.body}</p>
              ) : null}
            </AssistantBubble>
          ) : null}

          {isBusy ? <TypingIndicator /> : null}
          <div ref={scrollAnchorRef} className="h-2" aria-hidden />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center px-4 pt-2 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={flowStep === "hook" || isBusy}
            className="h-9 rounded-lg px-2 text-muted-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
        <IntakeChatComposer
          flowStep={flowStep}
          ccAgent={ccAgent}
          targetJobUrl={targetJobUrl}
          onTargetJobUrlChange={onTargetJobUrlChange}
          onKnowsTargetJobChange={onKnowsTargetJobChange}
          onUsWorkEligibleChange={onUsWorkEligibleChange}
          onSelectRole={onSelectRole}
          currentAnswer={currentAnswer}
          onCurrentAnswerChange={onCurrentAnswerChange}
          answerError={answerError}
          prefsForm={prefsForm}
          linkedInUrl={linkedInUrl}
          onLinkedInUrlChange={onLinkedInUrlChange}
          resumeText={resumeText}
          resumeFileName={resumeFileName}
          onResumeFile={onResumeFile}
          isReadingResume={isReadingResume}
          profileCompleteForGenerate={profileCompleteForGenerate}
          profileIncompleteHint={profileIncompleteHint}
          profileInsight={profileInsight}
          quizIndex={quizIndex}
          onNext={onNext}
          onGenerate={onGenerate}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}

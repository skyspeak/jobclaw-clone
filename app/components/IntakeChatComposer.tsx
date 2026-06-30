"use client";

import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ArrowRight, Loader2, Send } from "lucide-react";

import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakeUnlockRoadmapPanel } from "@/app/components/IntakeUnlockRoadmapPanel";
import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DREAM_JOB_SKIP_CHIP,
  PROFILE_SKIP_CHIP,
  type CcAgentFlowState,
  type CcAgentStepId,
} from "@/lib/cc-agent-flow";
import { QUESTIONS } from "@/lib/intake-questions";
import { cn } from "@/lib/utils";

type IntakeChatComposerProps = {
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
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeText: string;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
  quizIndex: number;
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
  onQuit?: () => void;
  onBack?: () => void;
  isBusy: boolean;
  showAnswerError?: boolean;
  variant?: "chat" | "panel";
};

function ChatInputRow({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  inputType = "text",
  submitDisabled,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  inputType?: "text" | "url" | "email";
  submitDisabled?: boolean;
  testId?: string;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!disabled && !submitDisabled) {
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type={inputType}
        inputMode={inputType === "url" ? "url" : inputType === "email" ? "email" : "text"}
        autoComplete={inputType === "email" ? "email" : inputType === "url" ? "url" : "off"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        data-testid={testId}
        className="h-11 min-h-11 flex-1 rounded-full border-border/70 bg-muted/30 px-4 text-base sm:h-10 sm:text-sm"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || submitDisabled}
        className="size-11 shrink-0 touch-manipulation rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:size-10"
        aria-label="Send"
        data-testid="button-send"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function IntakeChatComposer({
  flowStep,
  ccAgent,
  targetJobUrl,
  onTargetJobUrlChange,
  onNoDreamJob,
  onSelectRole: _onSelectRole,
  onSkipProfileUpload,
  currentAnswer,
  onCurrentAnswerChange,
  answerError,
  linkedInUrl,
  onLinkedInUrlChange,
  resumeText: _resumeText,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  profileCompleteForGenerate: _profileCompleteForGenerate,
  profileIncompleteHint: _profileIncompleteHint,
  quizIndex,
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
  onQuit,
  onBack: _onBack,
  isBusy,
  showAnswerError = true,
  variant = "panel",
}: IntakeChatComposerProps) {
  const currentQuestion = flowStep === "quiz" ? QUESTIONS[quizIndex] : null;
  const isBusyOrUnlocking = isBusy || isUnlockingRoadmap;

  function handleQuizKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (currentAnswer.trim()) {
        onNext();
      }
    }
  }

  if (variant !== "chat") {
    return null;
  }

  const footerClass = "mx-auto w-full max-w-2xl px-3 py-2.5 sm:px-6 sm:py-3";

  if (flowStep === "vetting-result") {
    const roleLabel = ccAgent.vettingResult?.inferredRoleLabel ?? "your target role";

    return (
      <div className={footerClass}>
        <IntakeUnlockRoadmapPanel
          email={unlockEmail}
          onEmailChange={onUnlockEmailChange ?? (() => undefined)}
          contactConsent={unlockContactConsent}
          onContactConsentChange={onUnlockContactConsentChange ?? (() => undefined)}
          roleLabel={roleLabel}
          gapSummary={gapEmailSummary}
          error={unlockError}
          isSubmitting={isUnlockingRoadmap}
          onSubmit={() => onUnlockRoadmapSubmit?.()}
          compact
          inline
        />
      </div>
    );
  }

  if (flowStep === "unlock-roadmap") {
    const roleLabel = ccAgent.vettingResult?.inferredRoleLabel ?? "your target role";

    return (
      <div className={footerClass}>
        <IntakeUnlockRoadmapPanel
          email={unlockEmail}
          onEmailChange={onUnlockEmailChange ?? (() => undefined)}
          contactConsent={unlockContactConsent}
          onContactConsentChange={onUnlockContactConsentChange ?? (() => undefined)}
          roleLabel={roleLabel}
          gapSummary={gapEmailSummary}
          error={unlockError}
          isSubmitting={isUnlockingRoadmap}
          onSubmit={() => onUnlockRoadmapSubmit?.()}
          compact
          inline
        />
      </div>
    );
  }

  if (flowStep === "roadmap") {
    return null;
  }

  if (flowStep === "journey") {
    return (
      <div className={cn(footerClass, "space-y-2")}>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Continue and sign up to <span className="font-semibold text-foreground">Stay Relevant</span>
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {onQuit ? (
            <Button
              type="button"
              variant="outline"
              onClick={onQuit}
              disabled={isBusy}
              className="h-11 min-h-11 touch-manipulation rounded-full sm:mr-auto"
              data-testid="button-quit"
            >
              Quit
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onNext}
            disabled={isBusy}
            className="cta-glow h-11 min-h-11 flex-1 touch-manipulation rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-initial sm:px-6"
            data-testid="button-next"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…
              </>
            ) : (
              <>
                Become AI native by honing your skills
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(footerClass, "space-y-2")}>
      {showAnswerError && answerError ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {answerError}
        </p>
      ) : null}

      {flowStep === "linkedin" ? (
        <>
          <IntakeOptionChips
            options={[PROFILE_SKIP_CHIP]}
            value={ccAgent.skippedProfileUpload ? PROFILE_SKIP_CHIP : ""}
            onChange={() => onSkipProfileUpload()}
            stepIndex={0}
          />
          <ChatInputRow
            value={linkedInUrl}
            onChange={onLinkedInUrlChange}
            onSubmit={onNext}
            placeholder="https://www.linkedin.com/in/your-profile"
            disabled={isBusy || ccAgent.skippedProfileUpload}
            inputType="url"
            submitDisabled={isBusy || (!linkedInUrl.trim() && !ccAgent.skippedProfileUpload)}
            testId="input-linkedin-url"
          />
        </>
      ) : null}

      {flowStep === "target-job-url" ? (
        <>
          <ChatInputRow
            value={targetJobUrl}
            onChange={onTargetJobUrlChange}
            onSubmit={onNext}
            placeholder="Paste a job listing URL…"
            disabled={isBusy || ccAgent.knowsTargetJob === false}
            inputType="url"
            submitDisabled={
              isBusy || (ccAgent.knowsTargetJob !== false && !targetJobUrl.trim())
            }
            testId="input-target-job-url"
          />
          <button
            type="button"
            onClick={onNoDreamJob}
            data-testid="link-no-job-url"
            className={cn(
              "px-1 text-xs underline underline-offset-2 transition-colors",
              ccAgent.knowsTargetJob === false
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {DREAM_JOB_SKIP_CHIP}
          </button>
        </>
      ) : null}

      {flowStep === "profile-upload" ? (
        <>
          <ChatInputRow
            value={linkedInUrl}
            onChange={onLinkedInUrlChange}
            onSubmit={onNext}
            placeholder="LinkedIn URL (optional if résumé uploaded)"
            disabled={isBusy || ccAgent.skippedProfileUpload}
            inputType="url"
            testId="input-linkedin-url"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,.md,.rtf,.csv,.json"
                className="sr-only"
                data-testid="input-resume-file"
                onChange={onResumeFile}
                disabled={isBusy || ccAgent.skippedProfileUpload}
              />
              <span className="inline-flex min-h-9 touch-manipulation items-center rounded-full border border-border/70 bg-muted/30 px-3 text-xs font-medium text-foreground">
                {resumeFileName ? `Résumé: ${resumeFileName}` : "Upload résumé"}
              </span>
            </label>
            {isReadingResume ? (
              <span className="text-xs text-muted-foreground">Reading file…</span>
            ) : null}
          </div>
          <IntakeOptionChips
            options={[PROFILE_SKIP_CHIP]}
            value={ccAgent.skippedProfileUpload ? PROFILE_SKIP_CHIP : ""}
            onChange={() => onSkipProfileUpload()}
            stepIndex={0}
          />
          <Button
            type="button"
            onClick={onNext}
            disabled={isBusy}
            className="h-11 w-full touch-manipulation rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            data-testid="button-next"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </>
      ) : null}

      {flowStep === "quiz" && currentQuestion ? (
        <>
          <IntakeOptionChips
            options={currentQuestion.options}
            value={currentAnswer}
            onChange={onCurrentAnswerChange}
            stepIndex={quizIndex}
          />
          <div className="flex items-end gap-2">
            <VoiceTextarea
              key={`composer-q-${quizIndex}`}
              placeholder="Type your answer…"
              data-testid={`textarea-q${quizIndex + 1}`}
              value={currentAnswer}
              onValueChange={onCurrentAnswerChange}
              onKeyDown={handleQuizKeyDown}
              micDisabled={isBusy}
              micLabel="Speak your answer"
              className="min-h-[44px] max-h-28 flex-1 rounded-3xl border-border/70 bg-muted/30 py-2.5 pl-4 pr-14 text-base"
            />
            <Button
              type="button"
              size="icon"
              onClick={onNext}
              disabled={isBusy || !currentAnswer.trim()}
              className="size-11 shrink-0 touch-manipulation rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Send answer"
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for new line
          </p>
        </>
      ) : null}

      {flowStep === "connect" || flowStep === "resume" ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={isBusy}
          className="h-11 w-full touch-manipulation rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          data-testid="button-next"
        >
          Continue <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowRight, Loader2, Send } from "lucide-react";

import {
  IntakeDreamJobPanel,
  IntakeProfileUploadPanel,
  IntakeResumePanel,
  IntakeVettingResultPanel,
} from "@/app/components/IntakeCcAgentPanels";
import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakePrefsFields } from "@/app/components/IntakePrefsFields";
import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Button } from "@/components/ui/button";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { QUESTIONS, type PrefsValues } from "@/lib/intake-questions";
import type { ParsedProfileInsight } from "@/lib/profile-parse";

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
  quizIndex: number;
  onNext: () => void;
  onGenerate: () => void;
  isBusy: boolean;
};

export function IntakeChatComposer({
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
  quizIndex,
  onNext,
  onGenerate,
  isBusy,
}: IntakeChatComposerProps) {
  const currentQuestion = flowStep === "quiz" ? QUESTIONS[quizIndex] : null;

  function handleQuizKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (currentAnswer.trim()) {
        onNext();
      }
    }
  }

  const continueLabel = "Continue";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 pb-4 pt-2 sm:px-0">
      <div className="rounded-2xl border border-border/70 bg-card shadow-lg shadow-black/[0.04]">
        <div className="border-b border-border/50 px-4 py-3 sm:px-5">
          {flowStep === "profile-upload" ? (
            <IntakeProfileUploadPanel
              linkedInUrl={linkedInUrl}
              onLinkedInUrlChange={onLinkedInUrlChange}
              resumeFileName={resumeFileName}
              resumeText={resumeText}
              onResumeFile={onResumeFile}
              isReadingResume={isReadingResume}
              skippedProfileUpload={ccAgent.skippedProfileUpload}
              onSkipProfileUpload={onSkipProfileUpload}
            />
          ) : null}

          {flowStep === "target-job-url" ? (
            <IntakeDreamJobPanel
              targetJobUrl={targetJobUrl}
              onTargetJobUrlChange={onTargetJobUrlChange}
              noDreamJob={ccAgent.knowsTargetJob === false}
              onNoDreamJob={onNoDreamJob}
            />
          ) : null}

          {flowStep === "resume" ? (
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
          ) : null}

          {flowStep === "linkedin" ? (
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
          ) : null}

          {flowStep === "quiz" && currentQuestion ? (
            <div className="space-y-3">
              <IntakeOptionChips
                options={currentQuestion.options}
                value={currentAnswer}
                onChange={onCurrentAnswerChange}
                stepIndex={quizIndex}
              />
              <VoiceTextarea
                key={`composer-q-${quizIndex}`}
                placeholder="Type your answer…"
                data-testid={`textarea-q${quizIndex + 1}`}
                value={currentAnswer}
                onValueChange={onCurrentAnswerChange}
                onKeyDown={handleQuizKeyDown}
                micDisabled={isBusy}
                micLabel="Speak your answer"
                className="min-h-[48px] max-h-28 py-3 pl-4 pr-14 text-base"
              />
            </div>
          ) : null}

          {flowStep === "vetting-result" && ccAgent.vettingResult ? (
            <IntakeVettingResultPanel
              vetting={ccAgent.vettingResult}
              targetJobUrl={targetJobUrl}
              linkedInUrl={linkedInUrl}
              resumeFileName={resumeFileName}
            />
          ) : null}

          {flowStep === "search-filters" ? (
            <div className="space-y-3">
              {profileInsight?.suggestedRoles?.length ? (
                <p className="text-xs text-muted-foreground">
                  Example roles: {profileInsight.suggestedRoles.join(" · ")}
                </p>
              ) : null}
              <IntakePrefsFields prefsForm={prefsForm} isGenerating={isBusy} compact />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-5">
          {flowStep === "quiz" ? (
            <Button
              type="button"
              size="icon"
              onClick={onNext}
              disabled={isBusy || !currentAnswer.trim()}
              className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Send answer"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : flowStep === "search-filters" ? (
            <Button
              type="button"
              onClick={onGenerate}
              disabled={isBusy || !profileCompleteForGenerate}
              className="cta-glow h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              data-testid="button-submit"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  Generate brief <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={isBusy}
              className="cta-glow h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
              data-testid="button-next"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…
                </>
              ) : (
                <>
                  {continueLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {answerError ? <p className="text-sm font-medium text-destructive">{answerError}</p> : null}
      {flowStep === "quiz" ? (
        <p className="text-center text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
      ) : null}
    </div>
  );
}

"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

import {
  IntakeConnectPanel,
  IntakeDreamJobPanel,
  IntakeJourneyPanel,
  IntakeProfileUploadPanel,
  IntakeResumePanel,
  IntakeVettingResultPanel,
} from "@/app/components/IntakeCcAgentPanels";
import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Button } from "@/components/ui/button";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
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
  onGetHired?: () => void;
  onQuit?: () => void;
  onBack?: () => void;
  isBusy: boolean;
  /** When false, parent renders answerError above the composer (pinned footer). */
  showAnswerError?: boolean;
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
  linkedInUrl,
  onLinkedInUrlChange,
  resumeText,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  profileCompleteForGenerate,
  profileIncompleteHint,
  quizIndex,
  onNext,
  onGetHired,
  onQuit,
  onBack,
  isBusy,
  showAnswerError = true,
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

  const continueLabel =
    flowStep === "journey"
      ? "Become AI native by honing your skills"
      : "Continue";

  const showStayRelevantFooter = flowStep === "journey";
  const isVettingResult = flowStep === "vetting-result";
  const isExpandedAnalysisPanel = flowStep === "journey";

  if (isVettingResult) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
        <div className="flex shrink-0 items-center px-3 pt-1 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isBusy}
            className="min-h-11 touch-manipulation rounded-lg px-2 text-muted-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-4">
          {ccAgent.vettingResult ? (
            <IntakeVettingResultPanel
              vetting={ccAgent.vettingResult}
              targetJobUrl={targetJobUrl}
              linkedInUrl={linkedInUrl}
              resumeFileName={resumeFileName}
            />
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background/95 px-3 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <Button
            type="button"
            onClick={onGetHired}
            disabled={isBusy}
            className="cta-glow h-12 min-h-12 w-full touch-manipulation rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            data-testid="button-get-hired"
          >
            Bridge your gaps and get hired <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl space-y-2 px-3 pb-2 pt-1 sm:px-6 sm:pb-3",
        isExpandedAnalysisPanel && "flex min-h-0 flex-1 flex-col",
      )}
    >
      {showAnswerError && answerError ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {answerError}
        </p>
      ) : null}
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm",
          isExpandedAnalysisPanel && "min-h-0 flex-1",
        )}
      >
        <div
          className={cn(
            "overscroll-contain border-b border-border/40 px-3 py-3 sm:px-5",
            isExpandedAnalysisPanel
              ? "min-h-0 flex-1 overflow-y-auto"
              : "max-sm:max-h-none max-sm:overflow-visible sm:max-h-[min(40dvh,22rem)] sm:overflow-y-auto",
          )}
        >
          {flowStep === "connect" ? (
            <IntakeConnectPanel
              targetJobUrl={targetJobUrl}
              onTargetJobUrlChange={onTargetJobUrlChange}
              onNoDreamJob={onNoDreamJob}
              linkedInUrl={linkedInUrl}
              onLinkedInUrlChange={onLinkedInUrlChange}
              resumeFileName={resumeFileName}
              onResumeFile={onResumeFile}
              isReadingResume={isReadingResume}
              skippedProfileUpload={ccAgent.skippedProfileUpload}
              onSkipProfileUpload={onSkipProfileUpload}
            />
          ) : null}

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

          {flowStep === "journey" && ccAgent.vettingResult ? (
            <IntakeJourneyPanel vetting={ccAgent.vettingResult} />
          ) : null}
        </div>

        <div
          className={cn(
            "flex shrink-0 gap-2 px-3 py-3 sm:px-5",
            flowStep === "journey" ? "flex-col items-stretch" : "items-center justify-end",
          )}
        >
          {flowStep === "journey" ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Continue and sign up to <span className="font-semibold text-foreground">Stay Relevant</span>
            </p>
          ) : null}
          <div
            className={cn(
              "flex gap-2",
              showStayRelevantFooter
                ? "w-full flex-col-reverse sm:flex-row sm:items-center sm:justify-between"
                : "w-full justify-end",
            )}
          >
            {flowStep === "quiz" ? (
              <Button
                type="button"
                size="icon"
                onClick={onNext}
                disabled={isBusy || !currentAnswer.trim()}
                className="h-12 min-h-12 w-12 shrink-0 touch-manipulation rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Send answer"
                data-testid="button-send"
              >
                <Send className="h-5 w-5" />
              </Button>
            ) : (
              <>
                {flowStep === "journey" && onQuit ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onQuit}
                    disabled={isBusy}
                    className="h-12 min-h-12 touch-manipulation rounded-xl sm:mr-auto"
                    data-testid="button-quit"
                  >
                    Quit
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={isBusy}
                  className={cn(
                    "cta-glow min-h-12 touch-manipulation rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90",
                    flowStep === "journey"
                      ? "h-auto flex-1 px-4 py-3 text-left leading-snug sm:flex-initial sm:py-2.5"
                      : "h-12 px-5",
                  )}
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
              </>
            )}
          </div>
        </div>
      </div>

      {flowStep === "quiz" ? (
        <p className="text-center text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
      ) : null}
    </div>
  );
}

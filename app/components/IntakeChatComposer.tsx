"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { ArrowRight, Loader2, Send } from "lucide-react";

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

  const showStayRelevantCallout =
    flowStep === "vetting-result" || flowStep === "journey";
  const showStayRelevantFooter = flowStep === "journey";
  const isExpandedAnalysisPanel = flowStep === "vetting-result" || flowStep === "journey";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl space-y-2 px-4 pb-3 pt-1 sm:px-6",
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
            "overscroll-contain border-b border-border/40 px-4 py-3 sm:px-5",
            isExpandedAnalysisPanel
              ? "min-h-0 flex-1 overflow-y-auto"
              : "max-h-[min(40dvh,22rem)] overflow-y-auto",
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

          {flowStep === "vetting-result" && ccAgent.vettingResult ? (
            <IntakeVettingResultPanel
              vetting={ccAgent.vettingResult}
              targetJobUrl={targetJobUrl}
              linkedInUrl={linkedInUrl}
              resumeFileName={resumeFileName}
            />
          ) : null}

          {flowStep === "journey" && ccAgent.vettingResult ? (
            <IntakeJourneyPanel vetting={ccAgent.vettingResult} />
          ) : null}
        </div>

        <div
          className={cn(
            "flex shrink-0 gap-2 px-4 py-3 sm:px-5",
            showStayRelevantCallout ? "flex-col items-stretch" : "items-center justify-end",
          )}
        >
          {showStayRelevantCallout ? (
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Continue and sign up to <span className="font-semibold text-foreground">Stay Relevant</span>
            </p>
          ) : null}
          {flowStep === "vetting-result" ? (
            <Button
              type="button"
              onClick={onGetHired}
              disabled={isBusy}
              className="cta-glow h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              data-testid="button-get-hired"
            >
              Get hired <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : null}
          {flowStep === "vetting-result" ? null : (
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
              className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
                  className="h-11 rounded-xl sm:mr-auto"
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
                  "cta-glow h-11 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
                  flowStep === "journey"
                    ? "h-auto min-h-11 flex-1 px-4 py-2.5 text-left leading-snug sm:flex-initial"
                    : "px-5",
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
          )}
        </div>
      </div>

      {flowStep === "quiz" ? (
        <p className="text-center text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
      ) : null}
    </div>
  );
}

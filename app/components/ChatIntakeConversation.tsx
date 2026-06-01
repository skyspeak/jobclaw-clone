"use client";

import Link from "next/link";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, Bot, Loader2, Send } from "lucide-react";

import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakePrefsFields } from "@/app/components/IntakePrefsFields";
import { IntakeProfileFields } from "@/app/components/IntakeProfileFields";
import { VoiceTextarea } from "@/app/components/VoiceTextarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUESTIONS, type PrefsValues } from "@/lib/intake-questions";
import { cn } from "@/lib/utils";

type ChatIntakeConversationProps = {
  step: number;
  totalSteps: number;
  currentAnswer: string;
  onCurrentAnswerChange: (value: string) => void;
  answerError: string;
  prefsForm: UseFormReturn<PrefsValues>;
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  contactEmail: string;
  onContactEmailChange: (value: string) => void;
  contactPhone: string;
  onContactPhoneChange: (value: string) => void;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
  wizardAnswers: string[];
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
};

type ChatTurn =
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "assistant"; kind: "question"; step: number }
  | { id: string; role: "user"; kind: "answer"; step: number; content: string }
  | { id: string; role: "assistant"; kind: "prefs" }
  | { id: string; role: "assistant"; kind: "profile" };

function buildTurns(wizardAnswers: string[], step: number): ChatTurn[] {
  const turns: ChatTurn[] = [{ id: "welcome", role: "assistant", kind: "welcome" }];

  for (let i = 0; i < 5; i++) {
    const answered = Boolean(wizardAnswers[i]?.trim());
    const isCurrent = step === i && step < 5;
    const isPast = i < step || (i === step && answered && step > i);

    if (!answered && !isCurrent && i > step) {
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

  if (step >= 5) {
    turns.push({ id: "prefs", role: "assistant", kind: "prefs" });
  }
  if (step >= 6) {
    turns.push({ id: "profile", role: "assistant", kind: "profile" });
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
          JobClaw
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
  step,
  totalSteps,
  currentAnswer,
  onCurrentAnswerChange,
  answerError,
  prefsForm,
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
  profileCompleteForGenerate,
  profileIncompleteHint,
  wizardAnswers,
  onBack,
  onNext,
  onGenerate,
  isGenerating,
}: ChatIntakeConversationProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const currentQuestion = step < 5 ? QUESTIONS[step] : null;
  const turns = useMemo(() => buildTurns(wizardAnswers, step), [wizardAnswers, step]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, step, currentAnswer]);

  function handleSendAnswer() {
    if (step >= 5 || !currentAnswer.trim()) {
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

  const showQuestionComposer = step < 5 && currentQuestion;

  return (
    <div className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
      <header className="shrink-0 border-b border-border/60 bg-background/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground sm:text-sm">
            <Link className="tracking-wide text-foreground underline-offset-4 hover:underline" href="/">
              JOBCLAW
            </Link>
            <span>
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5 sm:h-2" />
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
                    Hi — I&apos;m here to help shape your career brief. I&apos;ll ask five short questions; tap the
                    chips below anytime to build your answer, or type in your own words.
                  </p>
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

            if (turn.kind === "prefs") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Almost there — any search filters?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional preferences to narrow down roles. Skip anything that doesn&apos;t matter.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakePrefsFields prefsForm={prefsForm} isGenerating={isGenerating} compact />
                  </div>
                </AssistantBubble>
              );
            }

            if (turn.kind === "profile") {
              return (
                <AssistantBubble key={turn.id} className="items-start">
                  <p className="font-medium">Last step — how can we reach you?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add LinkedIn, a text résumé, email, or phone. You need at least one before we generate your brief.
                  </p>
                  <div className="mt-4 border-t border-border/50 pt-4">
                    <IntakeProfileFields
                      linkedInUrl={linkedInUrl}
                      onLinkedInUrlChange={onLinkedInUrlChange}
                      resumeFileName={resumeFileName}
                      onResumeFile={onResumeFile}
                      isReadingResume={isReadingResume}
                      contactEmail={contactEmail}
                      onContactEmailChange={onContactEmailChange}
                      contactPhone={contactPhone}
                      onContactPhoneChange={onContactPhoneChange}
                      profileCompleteForGenerate={profileCompleteForGenerate}
                      profileIncompleteHint={profileIncompleteHint}
                    />
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
                  stepIndex={step}
                />
              </div>

              <div className="flex items-end gap-2">
                <VoiceTextarea
                  key={`chat-q-${step}`}
                  placeholder="Type or speak your answer…"
                  data-testid={`textarea-q${step + 1}`}
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
                  disabled={isGenerating || !currentAnswer.trim()}
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
                  disabled={step === 0 || isGenerating}
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
                disabled={step === 0 || isGenerating}
                className="h-12 rounded-2xl px-5"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>

              {step < 6 ? (
                <Button
                  type="button"
                  onClick={onNext}
                  className="cta-glow h-12 flex-1 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-none sm:px-8"
                  data-testid="button-next"
                >
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onGenerate}
                  disabled={isGenerating || !profileCompleteForGenerate}
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
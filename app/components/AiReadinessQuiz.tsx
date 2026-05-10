"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuizOption = {
  label: string;
  points: number;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

const questions: QuizQuestion[] = [
  {
    id: "workflow",
    prompt: "When you use AI at work, what do you usually bring to it?",
    options: [
      { label: "A vague request and hope", points: 1 },
      { label: "A clear task and some context", points: 2 },
      { label: "Goal, constraints, examples, and success criteria", points: 3 },
    ],
  },
  {
    id: "verification",
    prompt: "How do you check AI output?",
    options: [
      { label: "If it sounds right, I use it", points: 1 },
      { label: "I skim it and fix obvious issues", points: 2 },
      { label: "I verify facts, edge cases, and assumptions", points: 3 },
    ],
  },
  {
    id: "delegation",
    prompt: "Which tasks are you comfortable delegating to AI?",
    options: [
      { label: "Anything, if it is fast", points: 1 },
      { label: "Drafting, summarizing, and brainstorming", points: 2 },
      { label: "Well-scoped tasks where I can review the result", points: 3 },
    ],
  },
  {
    id: "data",
    prompt: "What do you do before pasting sensitive info into AI tools?",
    options: [
      { label: "Nothing special", points: 1 },
      { label: "Remove obvious personal details", points: 2 },
      { label: "Check privacy rules and minimize the data", points: 3 },
    ],
  },
  {
    id: "learning",
    prompt: "When AI gets something wrong, what happens next?",
    options: [
      { label: "I assume the tool is bad", points: 1 },
      { label: "I try a better prompt", points: 2 },
      { label: "I improve the task, context, and verification loop", points: 3 },
    ],
  },
];

export function AiReadinessQuiz() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const score = Object.values(answers).reduce((sum, points) => sum + points, 0);
    const maxScore = questions.length * 3;
    const answered = Object.keys(answers).length;
    const complete = answered === questions.length;
    const percent = Math.round((score / maxScore) * 100);
    const tier =
      percent >= 85
        ? "AI-ready operator"
        : percent >= 65
          ? "AI-capable learner"
          : "AI-curious beginner";

    return { answered, complete, maxScore, percent, score, tier };
  }, [answers]);

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = `I got ${result.percent}% on the AI Readiness Quiz: ${result.tier}. Try it.`;
  const sharePayload = `${shareText} ${shareUrl}`.trim();

  async function shareResult() {
    setCopied(false);

    if (navigator.share) {
      await navigator.share({
        title: "AI Readiness Quiz",
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(sharePayload);
    setCopied(true);
  }

  function resetQuiz() {
    setAnswers({});
    setCopied(false);
  }

  return (
    <section className="space-y-8 rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10" aria-labelledby="readiness-title">
      <div className="flex flex-wrap items-end justify-between gap-6 md:gap-12">
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            AI readiness quiz
          </p>
          <h1 id="readiness-title" className="max-w-xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.2rem,5vw,3.75rem)]">
            Can you work with AI without getting fooled by it?
          </h1>
          <p className="max-w-xl pt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
            Five quick questions. Get a readiness score, then challenge someone else.
          </p>
        </div>
        <div aria-live="polite" className="grid shrink-0 justify-items-end tabular-nums text-foreground">
          <span className="max-w-[12rem] text-right text-[0.72rem] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground md:text-[0.8rem]">
            {result.complete ? result.tier : "Answer all five"}
          </span>
          <strong className="leading-[0.92] md:text-[clamp(3rem,8vw,5rem)]">{result.percent}%</strong>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        {questions.map((question, index) => (
          <fieldset
            key={question.id}
            className="space-y-4 rounded-[20px] border border-border bg-card p-6 shadow-none"
          >
            <legend className="mb-4 font-semibold text-foreground">{index + 1}. {question.prompt}</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {question.options.map((option) => (
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-2xl border border-border bg-card p-4 text-sm leading-snug md:text-[0.93rem]",
                    answers[question.id] === option.points &&
                      "border-primary/55 bg-secondary text-foreground shadow-sm ring-1 ring-primary/30",
                  )}
                  key={option.label}
                >
                  <input
                    checked={answers[question.id] === option.points}
                    name={question.id}
                    type="radio"
                    className="mt-1 accent-[hsl(var(--primary))]"
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option.points,
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {result.complete
            ? `${result.score}/${result.maxScore} points. ${result.tier}.`
            : `${result.answered}/${questions.length} answered.`}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-2xl cta-glow" disabled={!result.complete} type="button" onClick={shareResult}>
            Share result
          </Button>
          <Button className="rounded-2xl" variant="outline" type="button" onClick={resetQuiz}>
            Reset quiz
          </Button>
        </div>
        {copied ? <p className="col-span-full text-sm text-muted-foreground">Quiz result copied to clipboard.</p> : null}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";

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
    <section className="card quiz-card" aria-labelledby="readiness-title">
      <div className="quiz-header">
        <div>
          <p className="eyebrow">AI readiness quiz</p>
          <h1 id="readiness-title">Can you work with AI without getting fooled by it?</h1>
          <p className="lead">
            Five quick questions. Get a readiness score, then challenge someone else.
          </p>
        </div>
        <div className="quiz-score" aria-live="polite">
          <span>{result.complete ? result.tier : "Answer all five"}</span>
          <strong>{result.percent}%</strong>
        </div>
      </div>

      <div className="quiz-questions">
        {questions.map((question, index) => (
          <fieldset className="quiz-question" key={question.id}>
            <legend>
              {index + 1}. {question.prompt}
            </legend>
            <div className="quiz-options">
              {question.options.map((option) => (
                <label
                  className={answers[question.id] === option.points ? "selected" : ""}
                  key={option.label}
                >
                  <input
                    checked={answers[question.id] === option.points}
                    name={question.id}
                    type="radio"
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

      <div className="quiz-footer">
        <p className="muted">
          {result.complete
            ? `${result.score}/${result.maxScore} points. ${result.tier}.`
            : `${result.answered}/${questions.length} answered.`}
        </p>
        <div className="actions">
          <button className="button" disabled={!result.complete} type="button" onClick={shareResult}>
            Share result
          </button>
          <button className="button secondary" type="button" onClick={resetQuiz}>
            Reset quiz
          </button>
        </div>
        {copied ? <p className="muted">Quiz result copied to clipboard.</p> : null}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { IntakeAnswers } from "@/lib/jobclaw";
import {
  MICRO_INTERNSHIP_PROGRAM,
  MICRO_INTERNSHIP_SPRINTS,
  rankSprintsForAnswers,
  type MicroInternshipSprint,
  type SprintRank,
} from "@/lib/micro-internships";

/** Keep in sync with `storageKey` in `ChatIntake.tsx`. */
const INTAKE_LOCAL_STORAGE_KEY = "jobclaw.turn-taking-session.v1";

const TOTAL_STEPS = 5 + 1 + MICRO_INTERNSHIP_SPRINTS.length + 1;

type ChatRole = "assistant" | "user" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  label?: string;
  content: string;
};

type StoredSession = {
  answers?: Partial<Record<keyof IntakeAnswers, string>>;
};

function normalizeStoredAnswers(raw: StoredSession["answers"]): IntakeAnswers {
  return {
    q1: raw?.q1 ?? "",
    q2: raw?.q2 ?? "",
    q3: raw?.q3 ?? "",
    q4: raw?.q4 ?? "",
    q5: raw?.q5 ?? "",
  };
}

function readRankedFromStorage(): SprintRank[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(INTAKE_LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSession;
    const answers = normalizeStoredAnswers(parsed.answers);
    const hasAny = Object.values(answers).some((value) => value.trim().length > 0);
    if (!hasAny) {
      return null;
    }
    return rankSprintsForAnswers(answers);
  } catch {
    return null;
  }
}

const introSlides: Array<{ label: string; content: string }> = [
  {
    label: "Welcome",
    content:
      "Micro-internships here mirror the same five prompts as the turn-taking intake: future day-to-day (Q1), hidden strengths (Q2), energizing problems (Q3), deal-breakers (Q4), and what progress looks like a year out (Q5). Each sprint below ties back to those answers—not generic buzzwords.",
  },
  {
    label: "Rhythm",
    content: [
      `Sprint length: ${MICRO_INTERNSHIP_PROGRAM.sprintLength}.`,
      MICRO_INTERNSHIP_PROGRAM.structure,
      `Expected load: ${MICRO_INTERNSHIP_PROGRAM.timeCommitment}`,
    ].join("\n"),
  },
  {
    label: "Sponsors",
    content:
      "Every sprint assigns three sponsors you can book for guidance: a domain sponsor who owns the business outcome, an operator sponsor who guards scope and stakeholder comms, and an AI practice sponsor who coaches prompting, verification, and safe data handling.\n\nStanding office hours: mid-sprint critique on evidence and narrative, late-sprint audit of AI workflows and redaction habits, and a final rehearsal before your stakeholder playback.",
  },
  {
    label: "AI-ready bar",
    content: [
      "We expect AI-ready operators who:",
      ...MICRO_INTERNSHIP_PROGRAM.aiExpectations.map((item) => `• ${item}`),
    ].join("\n"),
  },
  {
    label: "Survey hooks",
    content:
      "Use Q1 to pick the mission vertical, Q2 to choose your lane (facilitation, synthesis, ops, etc.), Q3 to choose the sprint family, Q4 as non-negotiables when negotiating host fit, and Q5 as the measurable outcome for your demo.",
  },
];

function formatMatchResults(ranked: SprintRank[]): string {
  const top = ranked.slice(0, 3);
  const lines = top.map(({ sprint, score }, index) => {
    const hint =
      score === 0
        ? " (no keyword overlap yet—still a fine starting point to read)"
        : ` · fit score ${score}`;
    return `${index + 1}. ${sprint.title}${hint}`;
  });
  return ["Suggested starting points:", ...lines.map((line) => `• ${line}`)].join("\n");
}

function formatSprintBubble(sprint: MicroInternshipSprint): string {
  const dl = [
    `Survey hooks`,
    `Q1 — ${sprint.surveyHooks.q1}`,
    `Q3 — ${sprint.surveyHooks.q3}`,
    `Q5 — ${sprint.surveyHooks.q5}`,
    "",
    `Business problem`,
    sprint.businessProblem,
    "",
    `AI leverage`,
    sprint.aiLeverage,
    "",
    `Deliverables`,
    ...sprint.deliverables.map((item) => `• ${item}`),
    "",
    `Sponsors`,
    ...sprint.sponsors.map((sponsor) => `• ${sponsor.role} — ${sponsor.guide}`),
    "",
    `Office hours`,
    ...sprint.officeHours.map((item) => `• ${item}`),
  ];
  return `${sprint.title}\n\n${dl.join("\n")}`;
}

function initialMessages(): ChatMessage[] {
  return [
    {
      id: "micro-system",
      role: "system",
      content:
        "Walk through micro-internships the same way as the JobClaw intake—one beat at a time.",
    },
    {
      id: "micro-intro-0",
      role: "assistant",
      label: introSlides[0].label,
      content: introSlides[0].content,
    },
  ];
}

export function MicroInternshipsProgram() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages());
  const [stepIndex, setStepIndex] = useState(0);
  const [matchResolved, setMatchResolved] = useState(false);
  const messageSeq = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const progress = Math.round((Math.min(stepIndex, TOTAL_STEPS - 1) / (TOTAL_STEPS - 1)) * 100);

  const transcript = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stepIndex]);

  function pushMessage(message: ChatMessage) {
    setMessages((current) => [...current, message]);
  }

  function appendUser(text: string) {
    messageSeq.current += 1;
    pushMessage({
      id: `micro-user-${messageSeq.current}`,
      role: "user",
      content: text,
    });
  }

  function appendAssistant(label: string, content: string) {
    messageSeq.current += 1;
    pushMessage({
      id: `micro-assistant-${messageSeq.current}`,
      role: "assistant",
      label,
      content,
    });
  }

  function handleContinue() {
    if (stepIndex === 5 && !matchResolved) {
      return;
    }

    appendUser("Continue");

    if (stepIndex < 4) {
      const nextIntro = introSlides[stepIndex + 1];
      appendAssistant(nextIntro.label, nextIntro.content);
      setStepIndex((previous) => previous + 1);
      return;
    }

    if (stepIndex === 4) {
      appendAssistant(
        "Matcher",
        "If you saved intake answers in this browser, we can rank sprints using keywords from your Q1, Q2, Q3, and Q5 replies. Otherwise you can skip and browse each sprint with Continue.",
      );
      setStepIndex(5);
      setMatchResolved(false);
      return;
    }

    if (stepIndex === 5 && matchResolved) {
      appendAssistant("Sprint 1 of 8", formatSprintBubble(MICRO_INTERNSHIP_SPRINTS[0]));
      setStepIndex(6);
      return;
    }

    if (stepIndex >= 6 && stepIndex <= 12) {
      const nextSprint = MICRO_INTERNSHIP_SPRINTS[stepIndex - 5];
      appendAssistant(
        `Sprint ${stepIndex - 4} of 8`,
        formatSprintBubble(nextSprint),
      );
      setStepIndex((previous) => previous + 1);
      return;
    }

    if (stepIndex === 13) {
      appendAssistant(
        "Done",
        [
          "That was the catalog. Take the AI readiness quiz if you want a quick gut-check on verification habits, then hop back to the intake when you are ready to refresh your answers.",
          "",
          "Links: Home chat intake · Quiz · Resume tailor",
        ].join("\n"),
      );
      setStepIndex(14);
    }
  }

  function handleMatchChoice(kind: "match" | "skip") {
    if (stepIndex !== 5 || matchResolved) {
      return;
    }

    if (kind === "match") {
      appendUser("Match from my intake");
      const ranked = readRankedFromStorage();
      if (!ranked) {
        appendAssistant(
          "Matcher",
          "No saved intake answers were found on this browser. Complete the chat intake on the same device, then open Matcher again with Continue reset below—or skip and browse manually.",
        );
      } else {
        appendAssistant("Matcher", formatMatchResults(ranked));
      }
    } else {
      appendUser("Skip matching");
      appendAssistant(
        "Matcher",
        "Understood. Use Continue to walk the eight sprints in order—or reset anytime to rerun the matcher after you finish intake.",
      );
    }

    setMatchResolved(true);
  }

  function resetWalkthrough() {
    messageSeq.current = 0;
    setMessages(initialMessages());
    setStepIndex(0);
    setMatchResolved(false);
  }

  const continueDisabled =
    (stepIndex === 5 && !matchResolved) || stepIndex >= TOTAL_STEPS - 1;

  const stepLabel = `${Math.min(stepIndex + 1, TOTAL_STEPS)} / ${TOTAL_STEPS}`;

  return (
    <section className="card chat-card" aria-labelledby="micro-internships-title">
      <div className="chat-header">
        <div>
          <p className="eyebrow">Micro-internships</p>
          <h2 id="micro-internships-title">Same walkthrough pattern as the intake.</h2>
          <p className="muted">
            One step at a time—quick replies for the matcher, Continue for everything else.
          </p>
        </div>
        <span className="step-count" aria-label={`Step ${stepLabel}`}>
          {stepLabel}
        </span>
      </div>

      <div className="progress" aria-label={`${progress}% complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="messages turn-log" aria-live="polite">
        {transcript.map((message) => (
          <div key={message.id} className={`bubble ${message.role}`}>
            {message.label ? (
              <>
                <strong>{message.label}</strong>
                <br />
              </>
            ) : null}
            <span className="bubble-body">{message.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="composer answer-form">
        {stepIndex === 5 && !matchResolved ? (
          <div className="quick-replies">
            <button className="quick-reply" type="button" onClick={() => handleMatchChoice("match")}>
              Match from my intake
            </button>
            <button className="quick-reply" type="button" onClick={() => handleMatchChoice("skip")}>
              Skip matching
            </button>
          </div>
        ) : null}

        <div className="actions">
          <button className="button" type="button" disabled={continueDisabled} onClick={handleContinue}>
            Continue
          </button>
          <button className="button secondary" type="button" onClick={resetWalkthrough}>
            Reset
          </button>
          <Link className="button secondary" href="/">
            Home intake
          </Link>
          <Link className="button secondary" href="/quiz">
            Quiz
          </Link>
          <Link className="button secondary" href="/tailor-resume">
            Resume tailor
          </Link>
        </div>
      </div>
    </section>
  );
}

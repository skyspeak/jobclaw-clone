"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { IntakeAnswers } from "@/lib/jobclaw";
import {
  MICRO_INTERNSHIP_PROGRAM,
  MICRO_INTERNSHIP_SPRINTS,
  rankSprintsForAnswers,
  type SprintRank,
} from "@/lib/micro-internships";

/** Keep in sync with `storageKey` in `ChatIntake.tsx`. */
const INTAKE_LOCAL_STORAGE_KEY = "jobclaw.turn-taking-session.v1";

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

function readMatchFromStorage(): SprintRank[] | null {
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

export function MicroInternshipsProgram() {
  const [ranked, setRanked] = useState<SprintRank[] | null>(null);
  const [triedMatch, setTriedMatch] = useState(false);

  const topMatches = useMemo(() => ranked?.slice(0, 3) ?? [], [ranked]);

  function handleMatchFromIntake() {
    setTriedMatch(true);
    setRanked(readMatchFromStorage());
  }

  return (
    <div className="micro-internships">
      <header className="micro-internships-header">
        <p className="eyebrow">Micro-internships</p>
        <h1>Two-week sprints for AI-ready operators.</h1>
        <p className="muted micro-internships-lede">
          Each sprint ties to the same five prompts as JobClaw intake—future day-to-day, hidden
          strengths, energizing problems, deal-breakers, and what forward motion looks like in a
          year—so placement stays anchored in real motivation, not buzzwords.
        </p>
      </header>

      <section className="card micro-internships-panel">
        <h2>Program rhythm</h2>
        <ul className="micro-internships-meta">
          <li>
            <strong>Sprint length:</strong> {MICRO_INTERNSHIP_PROGRAM.sprintLength}
          </li>
          <li>
            <strong>Structure:</strong> {MICRO_INTERNSHIP_PROGRAM.structure}
          </li>
          <li>
            <strong>Load:</strong> {MICRO_INTERNSHIP_PROGRAM.timeCommitment}
          </li>
        </ul>
        <h3 className="micro-internships-subhead">How sponsors show up</h3>
        <p className="muted">
          Every cohort pairs you with three sponsors: a domain sponsor who owns the business outcome,
          an operator sponsor who guards scope and communication, and an AI practice sponsor who
          coaches prompting, verification, and safe data handling.
        </p>
        <h3 className="micro-internships-subhead">Standing office hours</h3>
        <ul className="micro-internships-list">
          <li>Mid-sprint critique on evidence quality and narrative clarity.</li>
          <li>Late-sprint audit of AI workflows, failure modes, and redaction habits.</li>
          <li>Final rehearsal before the stakeholder playback.</li>
        </ul>
        <h3 className="micro-internships-subhead">AI expectations</h3>
        <ul className="micro-internships-list">
          {MICRO_INTERNSHIP_PROGRAM.aiExpectations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="micro-internships-match card">
        <h2>Match sprints to your intake answers</h2>
        <p className="muted">
          Finish the chat intake on the home page, then return here—we read the saved answers from
          your browser (same device) and rank sprints by keyword fit across your future vision,
          strengths, energizers, and one-year progress answers.
        </p>
        <div className="micro-internships-match-actions">
          <button type="button" className="button" onClick={handleMatchFromIntake}>
            Match from my intake
          </button>
          <Link className="button secondary" href="/">
            Go to intake chat
          </Link>
        </div>
        {triedMatch && !ranked && (
          <p className="micro-internships-match-note muted" role="status">
            No saved intake answers found. Complete the chat intake on this browser first.
          </p>
        )}
        {topMatches.length > 0 && (
          <div className="micro-internships-match-results">
            <p className="eyebrow">Suggested starting points</p>
            <ol className="micro-internships-top-match">
              {topMatches.map(({ sprint, score }, index) => (
                <li key={sprint.id}>
                  <strong>
                    {index + 1}. {sprint.title}
                  </strong>
                  <span className="muted">
                    {" "}
                    · fit score {score}
                    {score === 0 ? " (explore manually below)" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="micro-internships-catalog">
        <h2>Sprint catalog</h2>
        <p className="muted">
          Pick the sprint that mirrors your energizing problems (survey Q3) and future day-to-day
          (Q1). Use deal-breakers (Q4) when negotiating host fit; use one-year progress (Q5) as the
          demo metric.
        </p>
        <div className="micro-internships-grid">
          {MICRO_INTERNSHIP_SPRINTS.map((sprint) => (
            <article key={sprint.id} className="card micro-internships-card" id={sprint.id}>
              <p className="eyebrow">{sprint.id.replace(/-/g, " ")}</p>
              <h3>{sprint.title}</h3>
              <p>{sprint.passionHint}</p>
              <dl className="micro-internships-dl">
                <div>
                  <dt>Survey hooks</dt>
                  <dd>
                    <strong>Q1</strong> — {sprint.surveyHooks.q1}
                  </dd>
                  <dd>
                    <strong>Q3</strong> — {sprint.surveyHooks.q3}
                  </dd>
                  <dd>
                    <strong>Q5</strong> — {sprint.surveyHooks.q5}
                  </dd>
                </div>
                <div>
                  <dt>Business problem</dt>
                  <dd>{sprint.businessProblem}</dd>
                </div>
                <div>
                  <dt>AI leverage</dt>
                  <dd>{sprint.aiLeverage}</dd>
                </div>
                <div>
                  <dt>Deliverables</dt>
                  <dd>
                    <ul className="micro-internships-list compact">
                      {sprint.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Sponsors</dt>
                  <dd>
                    <ul className="micro-internships-sponsors">
                      {sprint.sponsors.map((sponsor) => (
                        <li key={sponsor.role}>
                          <strong>{sponsor.role}</strong>
                          <span className="muted"> — {sponsor.guide}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Office hours cadence</dt>
                  <dd>
                    <ul className="micro-internships-list compact">
                      {sprint.officeHours.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

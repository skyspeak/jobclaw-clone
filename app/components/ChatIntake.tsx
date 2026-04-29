"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  defaultSearchDefaults,
  IntakeAnswers,
  IntakeQuestionId,
  intakeQuestions,
  JobClawResponse,
  SearchRequest,
  SearchDefaults,
} from "@/lib/jobclaw";

const storageKey = "jobclaw.turn-taking-session.v1";

const emptyAnswers: IntakeAnswers = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
};

type ChatRole = "assistant" | "user" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  label?: string;
  content: string;
};

type ChatStep =
  | {
      id: IntakeQuestionId;
      label: string;
      prompt: string;
      type: "answer";
      required: true;
    }
  | {
      id: keyof SearchDefaults;
      label: string;
      prompt: string;
      type: "text" | "select" | "number" | "boolean";
      required?: false;
      placeholder?: string;
      options?: string[];
    };

type StoredSession = {
  answers: IntakeAnswers;
  defaults: SearchDefaults;
  currentStep: number;
  messages: ChatMessage[];
  result: JobClawResponse | null;
};

type SearchLink = {
  label: string;
  description: string;
  url: string;
};

const intakeSteps: ChatStep[] = [
  ...intakeQuestions.map((question) => ({
    ...question,
    type: "answer" as const,
    required: true as const,
  })),
  {
    id: "location",
    label: "Location",
    prompt: "Where should we focus the search? You can name a city, region, or say remote.",
    type: "text",
    placeholder: "Oakland, CA",
  },
  {
    id: "workMode",
    label: "Work mode",
    prompt: "What work mode do you prefer?",
    type: "select",
    options: ["Any", "Remote", "Hybrid", "On-site"],
  },
  {
    id: "seniority",
    label: "Seniority",
    prompt: "What level should JobClaw look for?",
    type: "select",
    options: [
      "Any",
      "Internship",
      "Entry level",
      "Associate",
      "Mid-Senior level",
      "Director",
      "Executive",
    ],
  },
  {
    id: "minSalary",
    label: "Minimum salary",
    prompt: "Do you have a minimum salary? You can skip this.",
    type: "text",
    placeholder: "$70,000",
  },
  {
    id: "requireVisaSponsorship",
    label: "Visa sponsorship",
    prompt: "Do you need visa sponsorship?",
    type: "boolean",
    options: ["No", "Yes"],
  },
  {
    id: "preferVolunteerRoles",
    label: "Volunteer roles",
    prompt: "Should JobClaw prefer volunteer or nonprofit opportunities?",
    type: "boolean",
    options: ["No", "Yes"],
  },
  {
    id: "maxResults",
    label: "Result count",
    prompt: "How many matches should it return?",
    type: "number",
    placeholder: "5",
  },
  {
    id: "notes",
    label: "Extra notes",
    prompt: "Anything else JobClaw should know before creating the search request?",
    type: "text",
    placeholder: "Prioritize onboarding, workforce development, LMS administration...",
  },
];

function createAssistantMessage(stepIndex: number): ChatMessage {
  const step = intakeSteps[stepIndex];

  if (!step) {
    return {
      id: "assistant-complete",
      role: "assistant",
      label: "Done",
      content: "I have everything I need. I will generate your search request now.",
    };
  }

  return {
    id: `assistant-${step.id}-${stepIndex}`,
    role: "assistant",
    label: step.label,
    content: step.prompt,
  };
}

function readStoredSession(): StoredSession {
  const fallback: StoredSession = {
    answers: emptyAnswers,
    defaults: defaultSearchDefaults,
    currentStep: 0,
    messages: [
      {
        id: "system-start",
        role: "system",
        content: "JobClaw intake started. Answer naturally; short or messy answers are fine.",
      },
      createAssistantMessage(0),
    ],
    result: null,
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredSession>;
    const currentStep = Math.min(parsed.currentStep ?? 0, intakeSteps.length);

    return {
      answers: { ...emptyAnswers, ...parsed.answers },
      defaults: { ...defaultSearchDefaults, ...parsed.defaults },
      currentStep,
      messages: parsed.messages?.length ? parsed.messages : fallback.messages,
      result: parsed.result ?? null,
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function ChatIntake() {
  const [storedSession] = useState(readStoredSession);
  const [answers, setAnswers] = useState<IntakeAnswers>(storedSession.answers);
  const [defaults, setDefaults] = useState<SearchDefaults>(storedSession.defaults);
  const [currentStep, setCurrentStep] = useState(storedSession.currentStep);
  const [messages, setMessages] = useState<ChatMessage[]>(storedSession.messages);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<JobClawResponse | null>(storedSession.result);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(storedSession.messages.length);

  const currentQuestion = intakeSteps[currentStep];
  const isComplete = currentStep >= intakeSteps.length;
  const progress = Math.round((Math.min(currentStep, intakeSteps.length) / intakeSteps.length) * 100);
  const canSkip = currentQuestion && !currentQuestion.required;

  const transcriptPreview = useMemo(
    () => messages.filter((message) => message.role !== "system").slice(-5),
    [messages],
  );
  const freeSearchLinks = useMemo(
    () => (result?.searchRequest ? buildFreeSearchLinks(result.searchRequest) : []),
    [result],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session: StoredSession = {
      answers,
      defaults,
      currentStep,
      messages,
      result,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [answers, currentStep, defaults, messages, result]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, result]);

  async function submitTurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentQuestion || !draft.trim() || isGenerating) {
      return;
    }

    await acceptTurn(draft.trim());
  }

  async function acceptTurn(rawValue: string, displayValue = rawValue) {
    if (!currentQuestion) {
      return;
    }

    const { nextAnswers, nextDefaults } = applyStepValue(
      currentQuestion,
      rawValue,
      answers,
      defaults,
    );
    const nextStep = currentStep + 1;
    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        id: nextMessageId("user"),
        role: "user",
        label: currentQuestion.label,
        content: displayValue,
      },
    ];

    if (nextStep < intakeSteps.length) {
      nextMessages.push(createAssistantMessage(nextStep));
    } else {
      nextMessages.push(createAssistantMessage(nextStep));
    }

    setAnswers(nextAnswers);
    setDefaults(nextDefaults);
    setCurrentStep(nextStep);
    setMessages(nextMessages);
    setDraft("");
    setError("");

    if (nextStep === intakeSteps.length) {
      await generateSearchRequest(nextAnswers, nextDefaults, nextMessages);
    }
  }

  async function skipTurn() {
    if (!currentQuestion || currentQuestion.required || isGenerating) {
      return;
    }

    await acceptTurn("", "Skip");
  }

  async function generateSearchRequest(
    nextAnswers = answers,
    nextDefaults = defaults,
    nextMessages = messages,
  ) {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: nextAnswers, defaults: nextDefaults }),
      });

      const payload = (await response.json()) as JobClawResponse;

      if (!response.ok) {
        throw new Error(payload.summary || "Unable to generate a search request.");
      }

      setResult(payload);
      setMessages([
        ...nextMessages,
        {
          id: nextMessageId("assistant-result"),
          role: "assistant",
          label: "Search request",
          content: payload.summary,
        },
      ]);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to generate a search request.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function resetSession() {
    const freshSession = readFreshSession();

    setAnswers(freshSession.answers);
    setDefaults(freshSession.defaults);
    setCurrentStep(freshSession.currentStep);
    setMessages(freshSession.messages);
    setDraft("");
    setResult(null);
    setError("");
    window.localStorage.removeItem(storageKey);
  }

  return (
    <section className="card chat-card" aria-labelledby="chat-title">
      <div className="chat-header">
        <div>
          <p className="eyebrow">Turn-taking intake</p>
          <h2 id="chat-title">One question at a time.</h2>
          <p className="muted">
            JobClaw listens, stores the answer, and asks the next question only when
            you are done with the current turn.
          </p>
        </div>
        <span className="step-count">
          {Math.min(currentStep + 1, intakeSteps.length)} / {intakeSteps.length}
        </span>
      </div>

      <div className="progress" aria-label={`${progress}% complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="messages turn-log" aria-live="polite">
        {transcriptPreview.map((message) => (
          <div key={message.id} className={`bubble ${message.role}`}>
            {message.label ? (
              <>
                <strong>{message.label}</strong>
                <br />
              </>
            ) : null}
            {message.content}
          </div>
        ))}
        {isGenerating ? (
          <div className="bubble assistant typing">
            <strong>Generating</strong>
            <br />
            Creating your structured search request...
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {!isComplete && currentQuestion ? (
        <form className="answer-form composer" onSubmit={submitTurn}>
          {currentQuestion.type === "select" || currentQuestion.type === "boolean" ? (
            <div className="quick-replies">
              {currentQuestion.options?.map((option) => (
                <button
                  className="quick-reply"
                  key={option}
                  type="button"
                  onClick={() => acceptTurn(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          <textarea
            aria-label={currentQuestion.prompt}
            inputMode={currentQuestion.type === "number" ? "numeric" : "text"}
            placeholder={
              currentQuestion.type === "answer"
                ? "Type your answer here..."
                : currentQuestion.placeholder ?? "Type your answer here..."
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="actions">
            <button className="button" disabled={!draft.trim() || isGenerating}>
              Send
            </button>
            {canSkip ? (
              <button className="button secondary" type="button" onClick={skipTurn}>
                Skip
              </button>
            ) : null}
            <button className="button secondary" type="button" onClick={resetSession}>
              Reset
            </button>
          </div>
        </form>
      ) : (
        <div className="actions">
          <button
            className="button"
            disabled={isGenerating}
            onClick={() => generateSearchRequest()}
          >
            {isGenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button className="button secondary" type="button" onClick={resetSession}>
            New intake
          </button>
        </div>
      )}

      {error ? <p className="warning">{error}</p> : null}

      {result ? (
        <div className="result" aria-live="polite">
          <span className="pill">{result.searchRequest ? "Ready for handoff" : "Needs answers"}</span>
          <p>{result.summary}</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}

      {freeSearchLinks.length > 0 ? (
        <div className="search-results" aria-live="polite">
          <div>
            <span className="pill">Free search links</span>
            <p className="muted">
              No API key needed. These open searches in your browser instead of
              scraping results into the app.
            </p>
          </div>
          <ul className="result-list">
            {freeSearchLinks.map((item) => (
              <li key={item.label}>
                <a href={item.url} rel="noreferrer" target="_blank">
                  {item.label}
                </a>
                <p className="muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );

  function nextMessageId(prefix: string) {
    messageIdRef.current += 1;
    return `${prefix}-${messageIdRef.current}`;
  }
}

function readFreshSession(): StoredSession {
  return {
    answers: emptyAnswers,
    defaults: defaultSearchDefaults,
    currentStep: 0,
    messages: [
      {
        id: "system-start",
        role: "system",
        content: "JobClaw intake started. Answer naturally; short or messy answers are fine.",
      },
      createAssistantMessage(0),
    ],
    result: null,
  };
}

function applyStepValue(
  step: ChatStep,
  rawValue: string,
  answers: IntakeAnswers,
  defaults: SearchDefaults,
) {
  if (step.type === "answer") {
    return {
      nextAnswers: {
        ...answers,
        [step.id]: rawValue,
      },
      nextDefaults: defaults,
    };
  }

  return {
    nextAnswers: answers,
    nextDefaults: {
      ...defaults,
      [step.id]: normalizeDefaultValue(step, rawValue),
    },
  };
}

function normalizeDefaultValue(step: Exclude<ChatStep, { type: "answer" }>, rawValue: string) {
  if (!rawValue) {
    return defaultSearchDefaults[step.id];
  }

  if (step.type === "boolean") {
    return /^(yes|y|true|1)$/i.test(rawValue);
  }

  if (step.type === "number") {
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 5;
  }

  return rawValue;
}

function buildFreeSearchLinks(searchRequest: SearchRequest): SearchLink[] {
  const query = buildSearchQuery(searchRequest);
  const location = searchRequest.location || (searchRequest.workMode === "Remote" ? "remote" : "");
  const linkedInParams = new URLSearchParams({
    keywords: query,
  });
  const indeedParams = new URLSearchParams({
    q: query,
  });
  const idealistParams = new URLSearchParams({
    q: query,
  });

  if (location) {
    linkedInParams.set("location", location);
    indeedParams.set("l", location);
  }

  return [
    {
      label: "Open Google search",
      description: "Broad web search for public job posts matching this request.",
      url: `https://www.google.com/search?q=${encodeURIComponent(`${query} job posting`)}`,
    },
    {
      label: "Search company career pages",
      description: "Google search biased toward ATS and employer career pages.",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `${query} (site:greenhouse.io OR site:lever.co OR site:workdayjobs.com OR site:ashbyhq.com)`,
      )}`,
    },
    {
      label: "Search LinkedIn",
      description: "Open LinkedIn Jobs with the inferred keywords and location.",
      url: `https://www.linkedin.com/jobs/search/?${linkedInParams.toString()}`,
    },
    {
      label: "Search Indeed",
      description: "Open Indeed with the inferred keywords and location.",
      url: `https://www.indeed.com/jobs?${indeedParams.toString()}`,
    },
    {
      label: "Search Idealist",
      description: "Useful for nonprofit, mission-driven, and volunteer-oriented roles.",
      url: `https://www.idealist.org/en/jobs?${idealistParams.toString()}`,
    },
  ];
}

function buildSearchQuery(searchRequest: SearchRequest) {
  const exclusions = searchRequest.exclusions
    .filter(Boolean)
    .map((term) => `-${quoteIfNeeded(term)}`);

  return [
    quoteIfNeeded(searchRequest.jobTitle),
    ...searchRequest.keywords.map(quoteIfNeeded),
    searchRequest.seniority !== "Any" ? quoteIfNeeded(searchRequest.seniority) : "",
    searchRequest.location,
    searchRequest.workMode !== "Any" ? searchRequest.workMode : "",
    searchRequest.minSalary,
    searchRequest.requireVisaSponsorship ? "visa sponsorship" : "",
    ...exclusions,
  ]
    .filter(Boolean)
    .join(" ");
}

function quoteIfNeeded(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

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

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const emptyAnswers: IntakeAnswers = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
};

const emptyContact: ContactInfo = {
  raw: "",
  name: "",
  email: "",
  phone: "",
};

const workModes = ["Any", "Remote", "Hybrid", "On-site"] as const;
const seniorityLevels = [
  "Any",
  "Internship",
  "Entry level",
  "Associate",
  "Mid-Senior level",
  "Director",
  "Executive",
] as const;

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
    }
  | {
      id: "contact";
      label: string;
      prompt: string;
      type: "contact";
      required?: false;
      placeholder?: string;
    };

type StoredSession = {
  submissionId: string;
  answers: IntakeAnswers;
  contact: ContactInfo;
  defaults: SearchDefaults;
  currentStep: number;
  messages: ChatMessage[];
  result: JobClawResponse | null;
  profileDraft: LinkedInProfileDraft | null;
};

type ContactInfo = {
  raw: string;
  name: string;
  email: string;
  phone: string;
};

type SearchLink = {
  label: string;
  description: string;
  url: string;
};

type LinkedInProfileDraft = {
  archetype: {
    name: string;
    summary: string;
  };
  workStyle: {
    kindOfWork: string[];
    motivatingProblems: string[];
    avoid: string[];
  };
  idealJob: {
    title: string;
    why: string;
    adjacentTitles: string[];
  };
  linkedInProfile: {
    headline: string;
    about: string;
    featured: string[];
    experiencePositioning: Array<{
      title: string;
      bullets: string[];
    }>;
    skills: string[];
  };
  error?: string;
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
  {
    id: "contact",
    label: "Contact details",
    prompt:
      "Optional: leave your name, email, and phone number if you want us to contact you with matching results.",
    type: "contact",
    placeholder: "Jane Doe, jane@example.com, (555) 123-4567",
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
    submissionId: "",
    answers: emptyAnswers,
    contact: emptyContact,
    defaults: defaultSearchDefaults,
    currentStep: 0,
    messages: [
      {
        id: "system-start",
        role: "system",
        content:
          "Help us understand a little bit about you so we can guide you to the right jobs",
      },
      createAssistantMessage(0),
    ],
    result: null,
    profileDraft: null,
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
      submissionId: parsed.submissionId ?? "",
      answers: { ...emptyAnswers, ...parsed.answers },
      contact: { ...emptyContact, ...parsed.contact },
      defaults: normalizeStoredDefaults(parsed.defaults),
      currentStep,
      messages: parsed.messages?.length ? removeSearchRequestMessages(parsed.messages) : fallback.messages,
      result: parsed.result ?? null,
      profileDraft: parsed.profileDraft ?? null,
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

export function ChatIntake() {
  const [storedSession] = useState(readStoredSession);
  const [submissionId, setSubmissionId] = useState(storedSession.submissionId);
  const [answers, setAnswers] = useState<IntakeAnswers>(storedSession.answers);
  const [contact, setContact] = useState<ContactInfo>(storedSession.contact);
  const [defaults, setDefaults] = useState<SearchDefaults>(storedSession.defaults);
  const [currentStep, setCurrentStep] = useState(storedSession.currentStep);
  const [messages, setMessages] = useState<ChatMessage[]>(storedSession.messages);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<JobClawResponse | null>(storedSession.result);
  const [profileDraft, setProfileDraft] = useState<LinkedInProfileDraft | null>(
    storedSession.profileDraft,
  );
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceAvailabilityChecked, setVoiceAvailabilityChecked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(storedSession.messages.length);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseDraftRef = useRef("");

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
      submissionId,
      answers,
      contact,
      defaults,
      currentStep,
      messages,
      result,
      profileDraft,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [answers, contact, currentStep, defaults, messages, profileDraft, result, submissionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, result]);

  useEffect(() => {
    const supportCheckId = window.setTimeout(() => {
      setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
      setVoiceAvailabilityChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(supportCheckId);
      const recognition = recognitionRef.current;

      if (recognition) {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  async function submitTurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentQuestion || !draft.trim() || isGenerating) {
      return;
    }

    await acceptTurn(draft.trim());
  }

  async function submitTurnFromKeyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

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

    clearVoiceInput();

    const { nextAnswers, nextContact, nextDefaults } = applyStepValue(
      currentQuestion,
      rawValue,
      answers,
      contact,
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
    setContact(nextContact);
    setDefaults(nextDefaults);
    setCurrentStep(nextStep);
    setMessages(nextMessages);
    setDraft("");
    setError("");

    if (nextStep === intakeSteps.length) {
      await generateSearchRequest(nextAnswers, nextDefaults, nextMessages, nextContact);
    }
  }

  async function skipTurn() {
    if (!currentQuestion || currentQuestion.required || isGenerating) {
      return;
    }

    await acceptTurn("", "Skip");
  }

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      setVoiceStatus("Adding your voice answer...");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not available in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    const isMobileVoiceInput = isLikelyMobileDevice();
    const listeningStatus = isMobileVoiceInput
      ? "Listening... speak your answer. Mobile browsers may stop automatically after a pause."
      : "Listening... speak your answer, then tap Stop.";

    recognition.continuous = !isMobileVoiceInput;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    voiceBaseDraftRef.current = draft;
    recognitionRef.current = recognition;
    setVoiceError("");
    setVoiceStatus(listeningStatus);
    setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const nextDraft = [voiceBaseDraftRef.current, finalTranscript, interimTranscript]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ");

      setDraft(nextDraft);

      if (finalTranscript.trim()) {
        voiceBaseDraftRef.current = [voiceBaseDraftRef.current, finalTranscript.trim()]
          .filter(Boolean)
          .join(" ");
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(getVoiceErrorMessage(event.error));
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus((currentStatus) =>
        currentStatus === listeningStatus
          ? "Voice input stopped. Review your answer, then send it."
          : currentStatus,
      );
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("Voice input could not start. Check microphone permissions and try again.");
      setVoiceStatus("");
      setIsListening(false);
      recognitionRef.current = null;
    }
  }

  async function generateSearchRequest(
    nextAnswers = answers,
    nextDefaults = defaults,
    nextMessages = messages,
    nextContact = contact,
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
      setProfileDraft(null);
      setProfileError("");
      setMessages(nextMessages);

      await submitIntakeSubmission({
        nextAnswers,
        nextContact,
        nextDefaults,
        nextResult: payload,
        nextProfileDraft: null,
      });

      await generateProfileDraft(nextAnswers, nextDefaults, payload, nextContact);
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

    clearVoiceInput();
    setSubmissionId(freshSession.submissionId);
    setAnswers(freshSession.answers);
    setContact(freshSession.contact);
    setDefaults(freshSession.defaults);
    setCurrentStep(freshSession.currentStep);
    setMessages(freshSession.messages);
    setDraft("");
    setResult(null);
    setProfileDraft(null);
    setProfileError("");
    setError("");
    window.localStorage.removeItem(storageKey);
  }

  function clearVoiceInput() {
    abortVoiceRecognition();
    setIsListening(false);
    setVoiceStatus("");
    setVoiceError("");
  }

  function abortVoiceRecognition() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.abort();
    recognitionRef.current = null;
  }

  async function generateProfileDraft(
    nextAnswers = answers,
    nextDefaults = defaults,
    nextResult = result,
    nextContact = contact,
  ) {
    if (!nextResult?.searchRequest || isGeneratingProfile) {
      return;
    }

    setIsGeneratingProfile(true);
    setProfileError("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: nextAnswers,
          defaults: nextDefaults,
          searchSummary: nextResult.summary,
        }),
      });
      const payload = (await response.json()) as LinkedInProfileDraft;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to generate profile draft.");
      }

      setProfileDraft(payload);
      await submitIntakeSubmission({
        nextAnswers,
        nextContact,
        nextDefaults,
        nextResult,
        nextProfileDraft: payload,
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextMessageId("assistant-profile"),
          role: "assistant",
          label: "Archetype",
          content: `${payload.archetype.name}: ${payload.idealJob.title}`,
        },
      ]);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to generate profile draft.";
      setProfileError(message);
    } finally {
      setIsGeneratingProfile(false);
    }
  }

  async function submitIntakeSubmission({
    nextAnswers,
    nextContact,
    nextDefaults,
    nextResult,
    nextProfileDraft,
  }: {
    nextAnswers: IntakeAnswers;
    nextContact: ContactInfo;
    nextDefaults: SearchDefaults;
    nextResult: JobClawResponse;
    nextProfileDraft: LinkedInProfileDraft | null;
  }) {
    const clientSubmissionId = getSubmissionId();

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientSubmissionId,
          contact: nextContact,
          answers: nextAnswers,
          defaults: nextDefaults,
          result: nextResult,
          profileDraft: nextProfileDraft,
        }),
      });
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            `Unable to save the completed intake. API returned ${response.status} ${response.statusText}.`,
        );
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to save the completed intake.";

      console.error("Admin dashboard save failed after assessment generation.", {
        error: message,
      });
      setError(`The assessment was generated, but the admin dashboard save failed: ${message}`);
    }
  }

  function getSubmissionId() {
    if (submissionId) {
      return submissionId;
    }

    const nextSubmissionId = crypto.randomUUID();
    setSubmissionId(nextSubmissionId);

    return nextSubmissionId;
  }

  return (
    <section className="card chat-card" aria-labelledby="chat-title">
      <div className="chat-header">
        <div>
          <p className="eyebrow">Turn-taking intake</p>
          <h2 id="chat-title">One question at a time.</h2>
          <p className="muted">
            Help us understand a little bit about you so we can guide you to the
            right jobs
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
            onKeyDown={submitTurnFromKeyboard}
            onChange={(event) => setDraft(event.target.value)}
          />
          {voiceStatus || voiceError ? (
            <p className={voiceError ? "voice-status warning" : "voice-status"} aria-live="polite">
              {voiceError || voiceStatus}
            </p>
          ) : voiceAvailabilityChecked && !voiceSupported ? (
            <p className="voice-status" aria-live="polite">
              Voice input is not available in this browser. Typing, including your phone keyboard&apos;s
              microphone, still works.
            </p>
          ) : null}
          <div className="actions">
            <button className="button" disabled={!draft.trim() || isGenerating}>
              Send
            </button>
            <button
              className={`button secondary voice-button${isListening ? " listening" : ""}`}
              disabled={isGenerating || !voiceSupported}
              type="button"
              aria-pressed={isListening}
              onClick={toggleVoiceInput}
            >
              {isListening ? "Stop voice" : voiceSupported ? "Use voice" : "Voice unavailable"}
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
            disabled={isGenerating || isGeneratingProfile}
            onClick={() => generateSearchRequest()}
          >
            {isGenerating ? "Regenerating..." : "Regenerate"}
          </button>
          {result?.searchRequest ? (
            <a
              className="button"
              href={buildGoogleAiModeUrl(result.searchRequest)}
              rel="noreferrer"
              target="_blank"
            >
              Search Google AI Mode
            </a>
          ) : null}
          {result?.searchRequest ? (
            <button
              className="button secondary"
              disabled={isGeneratingProfile}
              type="button"
              onClick={() => generateProfileDraft()}
            >
              {isGeneratingProfile ? "Drafting profile..." : "Draft profile"}
            </button>
          ) : null}
          <button className="button secondary" type="button" onClick={resetSession}>
            New intake
          </button>
        </div>
      )}

      {error ? <p className="warning">{error}</p> : null}
      {profileError ? <p className="warning">{profileError}</p> : null}

      {contact.raw ? (
        <div className="contact-confirmation" aria-live="polite">
          <div>
            <span className="pill">Contact saved</span>
            <p className="muted">
              These follow-up details are saved with this chat session for matching results.
            </p>
          </div>
          <dl>
            {contact.name ? (
              <>
                <dt>Name</dt>
                <dd>{contact.name}</dd>
              </>
            ) : null}
            {contact.email ? (
              <>
                <dt>Email</dt>
                <dd>{contact.email}</dd>
              </>
            ) : null}
            {contact.phone ? (
              <>
                <dt>Phone</dt>
                <dd>{contact.phone}</dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}

      {isGeneratingProfile ? (
        <div className="profile-draft" aria-live="polite">
          <span className="pill">Drafting archetype</span>
          <p className="muted">
            Reading the completed intake and preparing a realistic LinkedIn-style profile.
          </p>
        </div>
      ) : null}

      {profileDraft ? <ProfileDraftView profile={profileDraft} /> : null}

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
    submissionId: "",
    answers: emptyAnswers,
    contact: emptyContact,
    defaults: defaultSearchDefaults,
    currentStep: 0,
    messages: [
      {
        id: "system-start",
        role: "system",
        content:
          "Help us understand a little bit about you so we can guide you to the right jobs",
      },
      createAssistantMessage(0),
    ],
    result: null,
    profileDraft: null,
  };
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function isLikelyMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches || window.navigator.maxTouchPoints > 0;
}

function getVoiceErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access was blocked. Allow microphone access, then try voice input again.";
  }

  if (error === "no-speech") {
    return "I did not hear anything. Tap Use voice and try speaking again.";
  }

  if (error === "audio-capture") {
    return "No microphone was found. Connect a microphone and try again.";
  }

  return "Voice input stopped unexpectedly. You can keep typing or try again.";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as { error?: string };
  } catch {
    return { error: text };
  }
}

function removeSearchRequestMessages(messages: ChatMessage[]) {
  return messages.filter(
    (message) => message.label !== "Search request" && !message.id.startsWith("assistant-result"),
  );
}

function normalizeStoredDefaults(defaults: Partial<SearchDefaults> | undefined): SearchDefaults {
  const nextDefaults = { ...defaultSearchDefaults, ...defaults };
  const maxResults =
    typeof nextDefaults.maxResults === "number"
      ? nextDefaults.maxResults
      : Number.parseInt(String(nextDefaults.maxResults), 10);

  return {
    ...nextDefaults,
    workMode: workModes.includes(nextDefaults.workMode) ? nextDefaults.workMode : "Any",
    seniority: seniorityLevels.includes(nextDefaults.seniority) ? nextDefaults.seniority : "Any",
    requireVisaSponsorship: nextDefaults.requireVisaSponsorship === true,
    preferVolunteerRoles: nextDefaults.preferVolunteerRoles === true,
    maxResults: Number.isFinite(maxResults) ? Math.min(Math.max(maxResults, 1), 50) : 5,
  };
}

function ProfileDraftView({ profile }: { profile: LinkedInProfileDraft }) {
  return (
    <div className="profile-draft" aria-live="polite">
      <div>
        <span className="pill">Archetype</span>
        <h3>{profile.archetype.name}</h3>
        <p>{profile.archetype.summary}</p>
      </div>

      <div className="profile-grid">
        <section>
          <h3>Ideal job</h3>
          <p>
            <strong>{profile.idealJob.title}</strong>
          </p>
          <p className="muted">{profile.idealJob.why}</p>
          <div className="tag-list">
            {profile.idealJob.adjacentTitles.map((title) => (
              <span key={title}>{title}</span>
            ))}
          </div>
        </section>

        <section>
          <h3>Kind of work</h3>
          <ul>
            {profile.workStyle.kindOfWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="linkedin-card">
        <p className="eyebrow">LinkedIn draft</p>
        <h3>{profile.linkedInProfile.headline}</h3>
        <p>{profile.linkedInProfile.about}</p>

        <h4>Featured ideas</h4>
        <ul>
          {profile.linkedInProfile.featured.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h4>Experience positioning</h4>
        {profile.linkedInProfile.experiencePositioning.map((section) => (
          <div key={section.title}>
            <p>
              <strong>{section.title}</strong>
            </p>
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}

        <h4>Skills</h4>
        <div className="tag-list">
          {profile.linkedInProfile.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function applyStepValue(
  step: ChatStep,
  rawValue: string,
  answers: IntakeAnswers,
  contact: ContactInfo,
  defaults: SearchDefaults,
) {
  if (step.type === "answer") {
    return {
      nextAnswers: {
        ...answers,
        [step.id]: rawValue,
      },
      nextContact: contact,
      nextDefaults: defaults,
    };
  }

  if (step.type === "contact") {
    return {
      nextAnswers: answers,
      nextContact: parseContactInfo(rawValue),
      nextDefaults: defaults,
    };
  }

  return {
    nextAnswers: answers,
    nextContact: contact,
    nextDefaults: {
      ...defaults,
      [step.id]: normalizeDefaultValue(step, rawValue),
    },
  };
}

function normalizeDefaultValue(
  step: Exclude<ChatStep, { type: "answer" } | { type: "contact" }>,
  rawValue: string,
) {
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

function parseContactInfo(rawValue: string): ContactInfo {
  const email = rawValue.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone =
    rawValue.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ??
    "";
  const name =
    rawValue
      .replace(email, "")
      .replace(phone, "")
      .split(/,|\n/)
      .map((part) => part.trim())
      .find(Boolean) ?? "";

  return {
    raw: rawValue,
    name,
    email,
    phone,
  };
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
      label: "Search Google AI Mode",
      description: "Open Chrome's Google AI Mode for job posts matching this request.",
      url: buildGoogleAiModeUrl(searchRequest),
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

function buildGoogleAiModeUrl(searchRequest: SearchRequest) {
  const params = new URLSearchParams({
    q: `${buildSearchQuery(searchRequest)} job posting`,
    udm: "50",
    sourceid: "chrome",
    cs: "1",
    hl: "en-US",
  });

  return `https://www.google.com/search?${params.toString()}`;
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

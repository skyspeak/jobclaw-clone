"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { IntakeGeneratingScreen } from "@/app/components/IntakeGeneratingScreen";
import { IntakeWizard } from "@/app/components/IntakeWizard";
import { Button } from "@/components/ui/button";
import {
  buildSearchQueryFromRequest,
  defaultSearchDefaults,
  IntakeAnswers,
  JobClawResponse,
  SearchDefaults,
  SearchRequest,
} from "@/lib/jobclaw";
import {
  prefsSchema,
  prefsValuesToSearchDefaults,
  questionSchema,
  searchDefaultsToPrefsValues,
  type PrefsValues,
} from "@/lib/intake-questions";
import type { GeneratedResume } from "@/lib/resume";
import type { ResumeSnapshot } from "@/lib/submissions";

const storageKey = "jobclaw.intake-wizard.v2";

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

type StoredSessionV2 = {
  submissionId: string;
  wizardStep: number;
  wizardAnswers: string[];
  currentAnswer: string;
  contact: ContactInfo;
  defaults: SearchDefaults;
  result: JobClawResponse | null;
  profileDraft: LinkedInProfileDraft | null;
  generatedResume: GeneratedResume | null;
  linkedInUrl: string;
  resumeText: string;
  resumeFileName: string;
};

type LegacyStoredSession = Partial<StoredSessionV2> & {
  messages?: unknown[];
  currentStep?: number;
  answers?: Partial<IntakeAnswers>;
};

function readFreshSession(): StoredSessionV2 {
  return {
    submissionId: "",
    wizardStep: 0,
    wizardAnswers: ["", "", "", "", ""],
    currentAnswer: "",
    contact: emptyContact,
    defaults: defaultSearchDefaults,
    result: null,
    profileDraft: null,
    generatedResume: null,
    linkedInUrl: "",
    resumeText: "",
    resumeFileName: "",
  };
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

function readStoredSession(): StoredSessionV2 {
  const fallback = readFreshSession();

  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored) as LegacyStoredSession;
    const next = readFreshSession();

    next.submissionId = parsed.submissionId ?? "";
    next.contact = { ...emptyContact, ...parsed.contact };
    next.defaults = normalizeStoredDefaults(parsed.defaults);
    next.result = parsed.result ?? null;
    next.profileDraft = parsed.profileDraft ?? null;
    next.generatedResume = parsed.generatedResume ?? null;
    next.linkedInUrl = typeof parsed.linkedInUrl === "string" ? parsed.linkedInUrl : "";
    next.resumeText = typeof parsed.resumeText === "string" ? parsed.resumeText : "";
    next.resumeFileName = typeof parsed.resumeFileName === "string" ? parsed.resumeFileName : "";

    if (parsed.wizardAnswers && Array.isArray(parsed.wizardAnswers) && parsed.wizardAnswers.length === 5) {
      next.wizardAnswers = parsed.wizardAnswers.map((s) => String(s ?? ""));
    } else if (parsed.answers) {
      next.wizardAnswers = [
        parsed.answers.q1 ?? "",
        parsed.answers.q2 ?? "",
        parsed.answers.q3 ?? "",
        parsed.answers.q4 ?? "",
        parsed.answers.q5 ?? "",
      ];
    }

    if (typeof parsed.wizardStep === "number") {
      next.wizardStep = Math.min(Math.max(parsed.wizardStep, 0), 6);
    } else if (typeof parsed.currentStep === "number") {
      const cs = parsed.currentStep;
      if (cs <= 4) {
        next.wizardStep = cs;
      } else if (cs <= 12) {
        next.wizardStep = 5;
      } else {
        next.wizardStep = 5;
      }
    }

    next.currentAnswer =
      typeof parsed.currentAnswer === "string"
        ? parsed.currentAnswer
        : next.wizardAnswers[next.wizardStep] ?? "";

    return next;
  } catch {
    window.localStorage.removeItem(storageKey);
    return fallback;
  }
}

function wizardAnswersToIntakeAnswers(rows: string[]): IntakeAnswers {
  return {
    q1: rows[0] ?? "",
    q2: rows[1] ?? "",
    q3: rows[2] ?? "",
    q4: rows[3] ?? "",
    q5: rows[4] ?? "",
  };
}

function buildResumeSnapshot(
  linkedInUrl: string,
  resumeText: string,
  resumeFileName: string,
): ResumeSnapshot | undefined {
  const u = linkedInUrl.trim();
  const t = resumeText.trim();
  const f = resumeFileName.trim();

  if (!u && !t && !f) {
    return undefined;
  }

  const snapshot: ResumeSnapshot = {};

  if (u) {
    snapshot.linkedInUrl = u;
  }

  if (t) {
    snapshot.resumeText = t;
  }

  if (f) {
    snapshot.resumeFileName = f;
  }

  return snapshot;
}

function hasMinimumProfileEvidence(
  linkedInUrl: string,
  resumeText: string,
  email: string,
  phone: string,
): boolean {
  return (
    linkedInUrl.trim().length > 0 ||
    resumeText.trim().length > 0 ||
    email.trim().length > 0 ||
    phone.trim().length > 0
  );
}

const PROFILE_GATE_HINT =
  "Add at least one of: LinkedIn profile URL, an uploaded résumé (text-based file), email, or phone number before continuing.";

type LiveJobSearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "unconfigured"; message: string; query: string }
  | { kind: "success"; query: string; results: Array<{ title: string; link: string; snippet: string }> }
  | { kind: "error"; message: string; query?: string };

export function ChatIntake() {
  const [storedSession] = useState(readStoredSession);
  const [submissionId, setSubmissionId] = useState(storedSession.submissionId);
  const [wizardStep, setWizardStep] = useState(storedSession.wizardStep);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>(storedSession.wizardAnswers);
  const [currentAnswer, setCurrentAnswer] = useState(storedSession.currentAnswer);
  const [answerError, setAnswerError] = useState("");
  const [contact, setContact] = useState<ContactInfo>(storedSession.contact);
  const [defaults, setDefaults] = useState<SearchDefaults>(storedSession.defaults);
  const [result, setResult] = useState<JobClawResponse | null>(storedSession.result);
  const [profileDraft, setProfileDraft] = useState<LinkedInProfileDraft | null>(
    storedSession.profileDraft,
  );
  const [generatedResume] = useState<GeneratedResume | null>(storedSession.generatedResume);
  const [linkedInUrl, setLinkedInUrl] = useState(storedSession.linkedInUrl);
  const [resumeText, setResumeText] = useState(storedSession.resumeText);
  const [resumeFileName, setResumeFileName] = useState(storedSession.resumeFileName);
  const [isReadingResume, setIsReadingResume] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [liveJobSearch, setLiveJobSearch] = useState<LiveJobSearchState>({ kind: "idle" });

  const prefsForm = useForm<PrefsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: searchDefaultsToPrefsValues(storedSession.defaults),
  });

  const totalSteps = 7;

  const profileCompleteForGenerate = useMemo(
    () => hasMinimumProfileEvidence(linkedInUrl, resumeText, contact.email, contact.phone),
    [linkedInUrl, resumeText, contact.email, contact.phone],
  );

  const freeSearchLinks = useMemo(
    () => (result?.searchRequest ? buildFreeSearchLinks(result.searchRequest) : []),
    [result],
  );

  const searchRequestFingerprint = useMemo(() => {
    const sr = result?.searchRequest;
    if (!sr) {
      return null;
    }

    return [sr.jobTitle, sr.keywords.join("|"), sr.location, sr.workMode, sr.seniority, sr.maxResults].join("::");
  }, [result?.searchRequest]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session: StoredSessionV2 = {
      submissionId,
      wizardStep,
      wizardAnswers,
      currentAnswer,
      contact,
      defaults,
      result,
      profileDraft,
      generatedResume,
      linkedInUrl,
      resumeText,
      resumeFileName,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [
    contact,
    currentAnswer,
    defaults,
    generatedResume,
    linkedInUrl,
    profileDraft,
    resumeFileName,
    resumeText,
    result,
    submissionId,
    wizardAnswers,
    wizardStep,
  ]);

  useEffect(() => {
    const sr = result?.searchRequest;

    if (!searchRequestFingerprint || !sr) {
      queueMicrotask(() => {
        setLiveJobSearch({ kind: "idle" });
      });
      return;
    }

    const pinnedSearchRequest = sr;

    let cancelled = false;

    async function loadLiveJobHits() {
      setLiveJobSearch({ kind: "loading" });

      try {
        const response = await fetch("/api/job-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchRequest: pinnedSearchRequest }),
        });

        const data = (await response.json()) as {
          configured?: boolean;
          message?: string;
          query?: string;
          results?: Array<{ title: string; link: string; snippet: string }>;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (data.configured === false) {
          setLiveJobSearch({
            kind: "unconfigured",
            message:
              data.message ??
              "Add SERPER_API_KEY to enable live Google job search results (see JobClaw .env.example).",
            query: data.query ?? `${buildSearchQueryFromRequest(pinnedSearchRequest)} job posting`,
          });
          return;
        }

        if (!response.ok || data.error) {
          setLiveJobSearch({
            kind: "error",
            message: data.error ?? `Search returned ${response.status}.`,
            query: data.query,
          });
          return;
        }

        setLiveJobSearch({
          kind: "success",
          query: data.query ?? "",
          results: Array.isArray(data.results) ? data.results : [],
        });
      } catch {
        if (!cancelled) {
          setLiveJobSearch({ kind: "error", message: "Could not reach the job search service." });
        }
      }
    }

    void loadLiveJobHits();

    return () => {
      cancelled = true;
    };
  }, [result?.searchRequest, searchRequestFingerprint]);

  function handleCurrentAnswerChange(value: string) {
    setCurrentAnswer(value);
    if (answerError) {
      setAnswerError("");
    }
  }

  function handleNext() {
    if (wizardStep >= 6) {
      return;
    }

    if (wizardStep < 5) {
      const validated = questionSchema.safeParse({ answer: currentAnswer });
      if (!validated.success) {
        setAnswerError(validated.error.issues[0]?.message ?? "Please share a bit more.");
        return;
      }

      setAnswerError("");
      const nextRows = [...wizardAnswers];
      nextRows[wizardStep] = currentAnswer;
      setWizardAnswers(nextRows);
      setCurrentAnswer(nextRows[wizardStep + 1] ?? "");
      setWizardStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (wizardStep === 5) {
      const prefs = prefsForm.getValues();
      setDefaults({ ...defaults, ...prefsValuesToSearchDefaults(prefs) });
      setWizardStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (wizardStep === 0) {
      return;
    }

    if (wizardStep === 6) {
      setWizardStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setAnswerError("");
    const nextRows = [...wizardAnswers];

    if (wizardStep < 5) {
      nextRows[wizardStep] = currentAnswer;
      setWizardAnswers(nextRows);
      setCurrentAnswer(nextRows[wizardStep - 1] ?? "");
    } else if (wizardStep === 5) {
      setCurrentAnswer(wizardAnswers[4] ?? "");
    }

    setWizardStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function readResumeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsReadingResume(true);

    try {
      const text = await file.text();

      if (!text.trim()) {
        throw new Error("That file did not contain readable text. Try a different text-based file (.txt, .md, …).");
      }

      setResumeText(text.trim());
      setResumeFileName(file.name);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to read that resume file.";
      setError(message);
    } finally {
      setIsReadingResume(false);
    }
  }

  async function handleGenerateBrief() {
    if (!hasMinimumProfileEvidence(linkedInUrl, resumeText, contact.email, contact.phone)) {
      return;
    }

    const prefs = prefsForm.getValues();
    const mergedDefaults = { ...defaults, ...prefsValuesToSearchDefaults(prefs) };
    setDefaults(mergedDefaults);

    const nextAnswers = wizardAnswersToIntakeAnswers(wizardAnswers);

    await generateSearchRequest(
      nextAnswers,
      mergedDefaults,
      contact,
      buildResumeSnapshot(linkedInUrl, resumeText, resumeFileName),
    );
  }

  async function generateSearchRequest(
    nextAnswers: IntakeAnswers = wizardAnswersToIntakeAnswers(wizardAnswers),
    nextDefaults: SearchDefaults = defaults,
    nextContact: ContactInfo = contact,
    nextResumeSnapshot: ResumeSnapshot | undefined = buildResumeSnapshot(
      linkedInUrl,
      resumeText,
      resumeFileName,
    ),
  ) {
    if (!hasMinimumProfileEvidence(linkedInUrl, resumeText, nextContact.email, nextContact.phone)) {
      setError(PROFILE_GATE_HINT);
      return;
    }

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

      await submitIntakeSubmission({
        nextAnswers,
        nextContact,
        nextDefaults,
        nextResult: payload,
        nextProfileDraft: null,
        nextResumeSnapshot,
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
    const fresh = readFreshSession();
    setSubmissionId(fresh.submissionId);
    setWizardStep(fresh.wizardStep);
    setWizardAnswers(fresh.wizardAnswers);
    setCurrentAnswer(fresh.currentAnswer);
    setContact(fresh.contact);
    setDefaults(fresh.defaults);
    prefsForm.reset(searchDefaultsToPrefsValues(fresh.defaults));
    setResult(null);
    setProfileDraft(null);
    setProfileError("");
    setError("");
    setAnswerError("");
    setLinkedInUrl("");
    setResumeText("");
    setResumeFileName("");
    window.localStorage.removeItem(storageKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generateProfileDraft(
    nextAnswers: IntakeAnswers = wizardAnswersToIntakeAnswers(wizardAnswers),
    nextDefaults: SearchDefaults = defaults,
    nextResult: JobClawResponse | null = result,
    nextContact: ContactInfo = contact,
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
        nextResumeSnapshot: buildResumeSnapshot(linkedInUrl, resumeText, resumeFileName),
      });
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
    nextResumeSnapshot,
  }: {
    nextAnswers: IntakeAnswers;
    nextContact: ContactInfo;
    nextDefaults: SearchDefaults;
    nextResult: JobClawResponse;
    nextProfileDraft: LinkedInProfileDraft | null;
    nextResumeSnapshot?: ResumeSnapshot;
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
          resumeSnapshot: nextResumeSnapshot,
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

  if (isGenerating) {
    return <IntakeGeneratingScreen />;
  }

  if (result) {
    return (
      <div className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-16 pt-5 sm:px-8 md:px-14 md:pt-10">
          <header className="mb-6 flex flex-col gap-4 sm:mb-8">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
              <Link className="text-foreground underline-offset-4 hover:underline" href="/">
                JOBCLAW
              </Link>
            </div>
            <Link
              href="/"
              className="w-fit text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              ← Back to home
            </Link>
          </header>

          <section
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-md"
            aria-labelledby="results-title"
          >
            <div className="border-b border-border/60 px-6 py-5 md:px-8">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Your brief
              </p>
              <h2 id="results-title" className="text-xl font-semibold tracking-tight text-foreground">
                Career brief and search plan
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                We combined your quiz answers with your preferences into this brief&apos;s actions below. Pick your
                next step: run a guided job search in Google AI Mode, sketch a LinkedIn-style profile draft, open the
                résumé tailoring flow, or clear everything and redo the quiz from a blank slate in this browser.
              </p>
            </div>

            <div className="flex flex-col gap-4 border-b border-border/60 p-6 md:px-8">
              <BriefActionBlock description="Take the intake quiz again from the beginning. This clears your saved answers, contact fields, LinkedIn URL, and résumé text in this browser so you can build a brand-new brief.">
                <Button
                  disabled={isGenerating || isGeneratingProfile}
                  className="h-auto min-h-11 w-full flex-col gap-0.5 rounded-2xl py-2.5 cta-glow sm:w-fit sm:items-start sm:px-6"
                  type="button"
                  onClick={resetSession}
                >
                  <span className="text-base font-semibold">Take the quiz again</span>
                  <span className="max-w-md text-left text-xs font-normal leading-snug text-primary-foreground/90">
                    Start from scratch (nothing from this session is kept)
                  </span>
                </Button>
              </BriefActionBlock>

              {result?.searchRequest ? (
                <BriefActionBlock description="Search for jobs with Google AI Mode using the keywords and filters from this brief. Opens a new tab in your browser.">
                  <Button asChild className="h-auto min-h-11 w-full flex-col gap-0.5 rounded-2xl py-2.5 cta-glow sm:w-fit sm:items-start sm:px-6">
                    <a href={buildGoogleAiModeUrl(result.searchRequest)} rel="noreferrer" target="_blank">
                      <span className="text-base font-semibold">Search for jobs with Google AI Mode</span>
                      <span className="max-w-md text-left text-xs font-normal leading-snug text-primary-foreground/90">
                        Opens Google with your search request prefilled
                      </span>
                    </a>
                  </Button>
                </BriefActionBlock>
              ) : null}

              {result?.searchRequest ? (
                <BriefActionBlock description="Generate a LinkedIn-style profile draft from this brief and your intake—headline, about, experience angles, and skills you can copy or edit.">
                  <Button
                    className="h-auto min-h-11 w-full flex-col gap-0.5 rounded-2xl py-2.5 sm:w-fit sm:items-start sm:px-6"
                    disabled={isGeneratingProfile}
                    type="button"
                    variant="outline"
                    onClick={() => generateProfileDraft()}
                  >
                    <span className="text-base font-semibold">
                      {isGeneratingProfile ? "Generating profile draft…" : "Draft a LinkedIn-style profile"}
                    </span>
                    <span className="max-w-md text-left text-xs font-normal leading-snug text-muted-foreground">
                      {isGeneratingProfile
                        ? "Reading your brief and building suggested copy…"
                        : "Uses this brief and your quiz answers on the server"}
                    </span>
                  </Button>
                </BriefActionBlock>
              ) : null}

              {result?.searchRequest ? (
                <BriefActionBlock description="Open JobClaw’s résumé tailoring tool in a new context so you can align your CV with roles you care about.">
                  <Button asChild variant="outline" className="h-auto min-h-11 w-full flex-col gap-0.5 rounded-2xl py-2.5 sm:w-fit sm:items-start sm:px-6">
                    <Link href="/tailor-resume">
                      <span className="text-base font-semibold">Tailor your résumé</span>
                      <span className="max-w-md text-left text-xs font-normal leading-snug text-muted-foreground">
                        Go to the résumé tailoring page
                      </span>
                    </Link>
                  </Button>
                </BriefActionBlock>
              ) : null}
            </div>

            {result?.searchRequest ? (
              <div className="border-b border-border/60 px-6 py-6 md:px-8" aria-live="polite">
                <div className="mb-4 space-y-2">
                  <span className="inline-flex rounded-full border border-secondary-border bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                    Live job search
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Fresh web hits for your inferred role and keywords (Google via Serper). Links are whatever Google
                    returned—always confirm on the employer or job-board page.
                  </p>
                </div>

                {liveJobSearch.kind === "loading" ? (
                  <p className="text-sm text-muted-foreground">Searching for job postings…</p>
                ) : null}

                {liveJobSearch.kind === "unconfigured" ? (
                  <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm">
                    <p className="text-foreground">{liveJobSearch.message}</p>
                    <p className="leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Key to add:</span>{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">SERPER_API_KEY</code> from{" "}
                      <a className="underline underline-offset-4" href="https://serper.dev" rel="noreferrer" target="_blank">
                        serper.dev
                      </a>
                      . (The workspace <code className="text-xs">jobclaw-repo</code> API uses{" "}
                      <code className="text-xs">GEMINI_API_KEY</code> to generate summaries and hypothetical roles—that
                      is separate from retrieving live pages from the web.)
                    </p>
                    {liveJobSearch.query ? (
                      <p className="break-words pt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Query we would run:</span>{" "}
                        {liveJobSearch.query}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {liveJobSearch.kind === "error" ? (
                  <div className="rounded-2xl border border-destructive/35 bg-destructive/5 p-4 text-sm text-destructive">
                    <p>{liveJobSearch.message}</p>
                    {liveJobSearch.query ? (
                      <p className="mt-2 break-words text-xs opacity-90">Query: {liveJobSearch.query}</p>
                    ) : null}
                  </div>
                ) : null}

                {liveJobSearch.kind === "success" && liveJobSearch.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No results came back for this search.</p>
                ) : null}

                {liveJobSearch.kind === "success" && liveJobSearch.results.length > 0 ? (
                  <ul className="grid list-none gap-3 p-0">
                    {liveJobSearch.results.map((hit) => (
                      <li key={hit.link} className="rounded-2xl border border-border bg-muted/25 p-4">
                        <a
                          className="font-semibold text-foreground underline-offset-4 hover:underline"
                          href={hit.link}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {hit.title}
                        </a>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{hit.link}</p>
                        {hit.snippet ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hit.snippet}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="border-t border-border/60 px-6 py-4 text-sm text-destructive md:px-8">{error}</p>
            ) : null}
            {profileError ? (
              <p className="border-border/60 px-6 pb-5 text-sm text-destructive md:px-8">{profileError}</p>
            ) : null}

            {(contact.email || contact.phone || contact.name || linkedInUrl.trim()) ? (
              <div className="space-y-4 border-t border-border/60 px-6 pb-8 pt-4 md:px-8" aria-live="polite">
                <span className="inline-flex rounded-full border border-secondary-border bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                  Profile on file
                </span>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 rounded-2xl border border-border bg-card p-5 text-sm">
                  {linkedInUrl.trim() ? (
                    <>
                      <dt className="font-medium text-muted-foreground">LinkedIn</dt>
                      <dd className="break-all">
                        <a
                          className="text-foreground underline-offset-4 hover:underline"
                          href={linkedInUrl.trim()}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {linkedInUrl.trim()}
                        </a>
                      </dd>
                    </>
                  ) : null}
                  {contact.name ? (
                    <>
                      <dt className="font-medium text-muted-foreground">Name</dt>
                      <dd>{contact.name}</dd>
                    </>
                  ) : null}
                  {contact.email ? (
                    <>
                      <dt className="font-medium text-muted-foreground">Email</dt>
                      <dd className="break-all">{contact.email}</dd>
                    </>
                  ) : null}
                  {contact.phone ? (
                    <>
                      <dt className="font-medium text-muted-foreground">Phone</dt>
                      <dd>{contact.phone}</dd>
                    </>
                  ) : null}
                  {resumeFileName || resumeText.trim() ? (
                    <>
                      <dt className="font-medium text-muted-foreground">Résumé</dt>
                      <dd>
                        {resumeFileName ? (
                          <span>
                            {resumeFileName}
                            {resumeText.trim() ? ` (${resumeText.trim().length.toLocaleString()} characters)` : null}
                          </span>
                        ) : (
                          <span>{resumeText.trim().length.toLocaleString()} characters from your last session</span>
                        )}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {isGeneratingProfile ? (
              <div className="space-y-2 border-t border-border/60 px-6 pb-8 pt-6 md:px-8" aria-live="polite">
                <span className="inline-flex rounded-full border border-secondary-border bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                  Drafting archetype
                </span>
                <p className="text-sm text-muted-foreground">
                  Reading the completed intake and preparing a realistic LinkedIn-style profile.
                </p>
              </div>
            ) : null}

            {profileDraft ? <ProfileDraftView profile={profileDraft} /> : null}

            {freeSearchLinks.length > 0 ? (
              <div className="space-y-6 border-t border-border/60 px-6 pb-10 pt-8 md:px-8" aria-live="polite">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-secondary-border bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                    Free search links
                  </span>
                  <p className="text-sm text-muted-foreground">
                    No API key needed. These open searches in your browser instead of scraping results into the app.
                  </p>
                </div>
                <ul className="grid list-none gap-4 p-0">
                  {freeSearchLinks.map((item) => (
                    <li
                      key={item.label}
                      className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] max-md:text-sm "
                    >
                      <a
                        href={item.url}
                        className="font-semibold text-foreground underline-offset-4 hover:underline"
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.label}
                      </a>
                      <p className="mt-2 text-muted-foreground">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  return (
    <IntakeWizard
      step={wizardStep}
      totalSteps={totalSteps}
      currentAnswer={currentAnswer}
      onCurrentAnswerChange={handleCurrentAnswerChange}
      answerError={answerError}
      prefsForm={prefsForm}
      linkedInUrl={linkedInUrl}
      onLinkedInUrlChange={setLinkedInUrl}
      resumeFileName={resumeFileName}
      onResumeFile={readResumeFile}
      isReadingResume={isReadingResume}
      contactEmail={contact.email}
      onContactEmailChange={(value) =>
        setContact((current) => ({ ...current, email: value }))
      }
      contactPhone={contact.phone}
      onContactPhoneChange={(value) =>
        setContact((current) => ({ ...current, phone: value }))
      }
      profileCompleteForGenerate={profileCompleteForGenerate}
      profileIncompleteHint={PROFILE_GATE_HINT}
      onBack={handleBack}
      onNext={handleNext}
      onGenerate={() => void handleGenerateBrief()}
      isGenerating={isGenerating}
    />
  );
}

function BriefActionBlock({ description, children }: { description: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-4 md:px-5 md:py-5">
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="flex flex-col items-stretch">{children}</div>
    </div>
  );
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

function ProfileDraftView({ profile }: { profile: LinkedInProfileDraft }) {
  return (
    <div className="space-y-8 border-t border-border/60 px-6 pb-10 pt-8 md:px-8" aria-live="polite">
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-secondary-border bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
          Archetype
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{profile.archetype.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.archetype.summary}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold tracking-tight">Ideal job</h3>
          <p>
            <strong className="text-foreground">{profile.idealJob.title}</strong>
          </p>
          <p className="mt-2 text-muted-foreground">{profile.idealJob.why}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.idealJob.adjacentTitles.map((title) => (
              <span
                key={title}
                className="rounded-full border border-border bg-secondary px-[10px] py-1 text-xs text-secondary-foreground"
              >
                {title}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold tracking-tight">Kind of work</h3>
          <ul className="space-y-2 pl-6 text-muted-foreground [&>li]:list-disc [&>li]:marker:text-muted-foreground">
            {profile.workStyle.kindOfWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid gap-6 rounded-3xl border border-border bg-card px-8 py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          LinkedIn draft
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{profile.linkedInProfile.headline}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.linkedInProfile.about}</p>

        <h4 className="text-base font-semibold text-foreground">Featured ideas</h4>
        <ul className="space-y-2 pl-6 text-muted-foreground [&>li]:list-disc">
          {profile.linkedInProfile.featured.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h4 className="mt-6 text-base font-semibold text-foreground">Experience positioning</h4>
        <div className="space-y-6">
          {profile.linkedInProfile.experiencePositioning.map((section) => (
            <div key={section.title}>
              <p>
                <strong className="text-foreground">{section.title}</strong>
              </p>
              <ul className="mt-2 space-y-2 pl-6 text-muted-foreground [&>li]:list-disc">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h4 className="text-base font-semibold text-foreground">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {profile.linkedInProfile.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border bg-secondary px-[10px] py-1 text-xs text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildFreeSearchLinks(searchRequest: SearchRequest): SearchLink[] {
  const query = buildSearchQueryFromRequest(searchRequest);
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
    q: `${buildSearchQueryFromRequest(searchRequest)} job posting`,
    udm: "50",
    sourceid: "chrome",
    cs: "1",
    hl: "en-US",
  });

  return `https://www.google.com/search?${params.toString()}`;
}

"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { IntakeGeneratingScreen } from "@/app/components/IntakeGeneratingScreen";
import { ChatIntakeConversation } from "@/app/components/ChatIntakeConversation";
import { IntakeSplashScreen } from "@/app/components/IntakeSplashScreen";
import {
  defaultSearchDefaults,
  IntakeAnswers,
  JobClawResponse,
  SearchDefaults,
} from "@/lib/jobclaw";
import {
  defaultCcAgentFlowState,
  type CcAgentFlowState,
  type VettingResult,
} from "@/lib/cc-agent-flow";
import {
  advanceCcAgentState,
  canProceedFromStep,
  retreatCcAgentState,
  setKnowsTargetJob,
} from "@/lib/cc-agent-intake-nav";
import { getFlowProgressIndex, getTotalFlowSteps } from "@/lib/cc-agent-flow";
import {
  buildResumeSnapshot,
  hasMinimumProfileEvidence,
  hasResumeOrLinkedInInput,
  INTAKE_WIZARD_STORAGE_KEY,
  type IntakeContactInfo,
  type IntakeProfileDraft,
  type IntakeWizardSession,
} from "@/lib/intake-session";
import type { ParsedProfileInsight } from "@/lib/profile-parse";
import {
  prefsSchema,
  prefsValuesToSearchDefaults,
  searchDefaultsToPrefsValues,
  wizardRowsToIntakeAnswers,
  type PrefsValues,
} from "@/lib/intake-questions";
import type { GeneratedResume } from "@/lib/resume";
import type { ResumeSnapshot } from "@/lib/submissions";

const storageKey = INTAKE_WIZARD_STORAGE_KEY;

const emptyContact: IntakeContactInfo = {
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

type LegacyStoredSession = Partial<IntakeWizardSession> & {
  messages?: unknown[];
  currentStep?: number;
  answers?: Partial<IntakeAnswers>;
};

function readFreshSession(): IntakeWizardSession {
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
    ccAgent: defaultCcAgentFlowState(),
    targetJobUrl: "",
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

function readStoredSession(): IntakeWizardSession {
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
    next.targetJobUrl = typeof parsed.targetJobUrl === "string" ? parsed.targetJobUrl : "";
    next.ccAgent = {
      ...defaultCcAgentFlowState(),
      ...(parsed.ccAgent && typeof parsed.ccAgent === "object" ? parsed.ccAgent : {}),
    };

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

const PROFILE_GATE_HINT =
  "Add your LinkedIn profile URL or upload a text-based résumé before continuing.";

type ChatIntakeProps = {
  variant?: "wizard" | "chat";
};

function hasIntakeProgress(session: IntakeWizardSession) {
  return (
    session.ccAgent.flowStep !== "hook" ||
    session.ccAgent.knowsTargetJob !== null ||
    session.wizardAnswers.some((answer) => answer.trim().length > 0) ||
    Boolean(session.linkedInUrl.trim() || session.resumeText.trim() || session.targetJobUrl.trim())
  );
}

export function ChatIntake({ variant = "chat" }: ChatIntakeProps) {
  const router = useRouter();
  const [storedSession] = useState(readStoredSession);
  const [quizStarted, setQuizStarted] = useState(() => hasIntakeProgress(storedSession));
  const [submissionId, setSubmissionId] = useState(storedSession.submissionId);
  const [ccAgent, setCcAgent] = useState<CcAgentFlowState>(storedSession.ccAgent);
  const [targetJobUrl, setTargetJobUrl] = useState(storedSession.targetJobUrl);
  const [wizardStep, setWizardStep] = useState(storedSession.wizardStep);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>(storedSession.wizardAnswers);
  const [currentAnswer, setCurrentAnswer] = useState(storedSession.currentAnswer);
  const [answerError, setAnswerError] = useState("");
  const [contact, setContact] = useState<IntakeContactInfo>(storedSession.contact);
  const [defaults, setDefaults] = useState<SearchDefaults>(storedSession.defaults);
  const [result, setResult] = useState<JobClawResponse | null>(storedSession.result);
  const [profileDraft, setProfileDraft] = useState<IntakeProfileDraft | null>(
    storedSession.profileDraft,
  );
  const [generatedResume] = useState<GeneratedResume | null>(storedSession.generatedResume);
  const [linkedInUrl, setLinkedInUrl] = useState(storedSession.linkedInUrl);
  const [resumeText, setResumeText] = useState(storedSession.resumeText);
  const [resumeFileName, setResumeFileName] = useState(storedSession.resumeFileName);
  const [isReadingResume, setIsReadingResume] = useState(false);
  const [isParsingProfile, setIsParsingProfile] = useState(false);
  const [isRunningTriage, setIsRunningTriage] = useState(false);
  const [profileInsight, setProfileInsight] = useState<ParsedProfileInsight | null>(null);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const prefsForm = useForm<PrefsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: searchDefaultsToPrefsValues(storedSession.defaults),
  });

  const totalSteps = getTotalFlowSteps(ccAgent.knowsTargetJob);
  const progressStep = getFlowProgressIndex(ccAgent);
  const flowStep = ccAgent.flowStep;

  const profileCompleteForGenerate = useMemo(
    () => hasMinimumProfileEvidence(linkedInUrl, resumeText),
    [linkedInUrl, resumeText],
  );

  useEffect(() => {
    if (result?.searchRequest) {
      router.replace("/intake/brief");
    }
  }, [result, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session: IntakeWizardSession = {
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
      ccAgent,
      targetJobUrl,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [
    ccAgent,
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
    targetJobUrl,
    wizardAnswers,
    wizardStep,
  ]);

  function handleCurrentAnswerChange(value: string) {
    setCurrentAnswer(value);
    if (answerError) {
      setAnswerError("");
    }
  }

  function applyProfileInsight(insight: ParsedProfileInsight) {
    const current = prefsForm.getValues();

    if (current.seniority === "Any" || !current.seniority) {
      prefsForm.setValue("seniority", insight.suggestedSeniority);
    }
    if (current.workMode === "Any" || !current.workMode) {
      prefsForm.setValue("workMode", insight.suggestedWorkMode);
    }
    if (!current.location?.trim() && insight.suggestedLocation.trim()) {
      prefsForm.setValue("location", insight.suggestedLocation);
    }

    const roleHint = insight.suggestedRoles.join(", ");
    const notesPrefix = insight.suggestedRoles.length
      ? `Example roles: ${roleHint}.`
      : "";
    const existingNotes = current.notes?.trim() ?? "";

    if (notesPrefix && !existingNotes.toLowerCase().includes("example roles:")) {
      prefsForm.setValue("notes", existingNotes ? `${existingNotes} ${notesPrefix}` : notesPrefix);
    }

    setDefaults((prev) => ({
      ...prev,
      ...prefsValuesToSearchDefaults(prefsForm.getValues()),
    }));
  }

  async function runTriage(): Promise<VettingResult | null> {
    setIsRunningTriage(true);
    setError("");

    try {
      const nextAnswers = wizardRowsToIntakeAnswers(wizardAnswers);
      const response = await fetch("/api/cc-agent/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowsTargetJob: ccAgent.knowsTargetJob === true,
          usWorkEligible: ccAgent.usWorkEligible,
          linkedInUrl,
          resumeText,
          resumeFileName,
          targetJobUrl,
          selectedRoleId: ccAgent.selectedRoleId,
          answers: nextAnswers,
        }),
      });

      const payload = (await response.json()) as {
        vetting: VettingResult;
        profileInsight: ParsedProfileInsight | null;
        roleSuggestions: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to run vetting.");
      }

      if (payload.profileInsight) {
        setProfileInsight(payload.profileInsight);
      }

      setCcAgent((current) => ({
        ...current,
        vettingResult: payload.vetting,
        roleSuggestions: payload.roleSuggestions,
        selectedRoleId: current.selectedRoleId || payload.vetting.inferredRoleId,
      }));

      return payload.vetting;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to run vetting.";
      setError(message);
      return null;
    } finally {
      setIsRunningTriage(false);
    }
  }

  async function parseProfileForFilters() {
    if (!hasResumeOrLinkedInInput(linkedInUrl, resumeText, resumeFileName)) {
      setError(PROFILE_GATE_HINT);
      return false;
    }

    setIsParsingProfile(true);
    setError("");

    try {
      const nextAnswers = wizardRowsToIntakeAnswers(wizardAnswers);
      const response = await fetch("/api/parse-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedInUrl,
          resumeText,
          resumeFileName,
          answers: nextAnswers,
        }),
      });

      const payload = (await response.json()) as ParsedProfileInsight & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to parse your profile.");
      }

      setProfileInsight(payload);
      applyProfileInsight(payload);
      return true;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to parse your profile.";
      setError(message);
      return false;
    } finally {
      setIsParsingProfile(false);
    }
  }

  async function handleNext() {
    if (flowStep === "search-filters") {
      return;
    }

    const gate = canProceedFromStep(flowStep, {
      ccAgent,
      targetJobUrl,
      linkedInUrl,
      resumeText,
      resumeFileName,
      currentAnswer,
      wizardAnswers,
    });

    if (!gate.ok) {
      setAnswerError(gate.message ?? "Please complete this step.");
      return;
    }

    setAnswerError("");

    if (flowStep === "hook" && ccAgent.knowsTargetJob !== null) {
      const nextAgent = setKnowsTargetJob(ccAgent, ccAgent.knowsTargetJob);
      setCcAgent(nextAgent);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const { next, nextCurrentAnswer, nextWizardAnswers } = advanceCcAgentState(
      ccAgent,
      wizardAnswers,
      currentAnswer,
    );

    let merged: CcAgentFlowState = next;

    if (next.flowStep === "vetting-result" && !next.vettingResult) {
      const vetting = await runTriage();
      if (!vetting) {
        return;
      }
      merged = { ...next, vettingResult: vetting };
    }

    if (next.flowStep === "search-filters" && !profileInsight) {
      const ok = await parseProfileForFilters();
      if (!ok) {
        return;
      }
    }

    setWizardAnswers(nextWizardAnswers);
    setCcAgent(merged);
    setCurrentAnswer(nextCurrentAnswer);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    if (flowStep === "hook") {
      return;
    }

    setAnswerError("");
    const { next, nextCurrentAnswer } = retreatCcAgentState(ccAgent, wizardAnswers, currentAnswer);
    setCcAgent(next);
    setCurrentAnswer(nextCurrentAnswer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleKnowsTargetJob(knows: boolean) {
    setCcAgent((current) => ({ ...current, knowsTargetJob: knows }));
  }

  function handleSelectRole(roleId: string) {
    setCcAgent((current) => ({ ...current, selectedRoleId: roleId }));
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
    if (!hasMinimumProfileEvidence(linkedInUrl, resumeText)) {
      return;
    }

    const prefs = prefsForm.getValues();
    const mergedDefaults = { ...defaults, ...prefsValuesToSearchDefaults(prefs) };
    setDefaults(mergedDefaults);

    const nextAnswers = wizardRowsToIntakeAnswers(wizardAnswers);

    await generateSearchRequest(
      nextAnswers,
      mergedDefaults,
      contact,
      buildResumeSnapshot(linkedInUrl, resumeText, resumeFileName),
    );
  }

  async function generateSearchRequest(
    nextAnswers: IntakeAnswers = wizardRowsToIntakeAnswers(wizardAnswers),
    nextDefaults: SearchDefaults = defaults,
    nextContact: IntakeContactInfo = contact,
    nextResumeSnapshot: ResumeSnapshot | undefined = buildResumeSnapshot(
      linkedInUrl,
      resumeText,
      resumeFileName,
    ),
  ) {
    if (!hasMinimumProfileEvidence(linkedInUrl, resumeText)) {
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

      await submitIntakeSubmission({
        nextAnswers,
        nextContact,
        nextDefaults,
        nextResult: payload,
        nextProfileDraft: null,
        nextResumeSnapshot,
      });

      await generateProfileDraft(nextAnswers, nextDefaults, payload, nextContact);
      router.push("/intake/brief");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to generate a search request.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateProfileDraft(
    nextAnswers: IntakeAnswers = wizardRowsToIntakeAnswers(wizardAnswers),
    nextDefaults: SearchDefaults = defaults,
    nextResult: JobClawResponse | null = result,
    nextContact: IntakeContactInfo = contact,
  ) {
    if (!nextResult?.searchRequest || isGeneratingProfile) {
      return;
    }

    setIsGeneratingProfile(true);

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
      const payload = (await response.json()) as IntakeProfileDraft;

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
      setError(message);
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
    nextContact: IntakeContactInfo;
    nextDefaults: SearchDefaults;
    nextResult: JobClawResponse;
    nextProfileDraft: IntakeProfileDraft | null;
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

  if (!quizStarted) {
    return (
      <IntakeSplashScreen
        onStart={() => {
          setQuizStarted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
      {error ? (
        <p className="mx-auto w-full max-w-2xl px-4 pt-4 text-sm font-medium text-destructive sm:px-6">
          {error}
        </p>
      ) : null}
      {variant === "chat" ? (
        <ChatIntakeConversation
          flowStep={flowStep}
          progressStep={progressStep}
          totalSteps={totalSteps}
          ccAgent={ccAgent}
          targetJobUrl={targetJobUrl}
          onTargetJobUrlChange={setTargetJobUrl}
          onKnowsTargetJobChange={handleKnowsTargetJob}
          onUsWorkEligibleChange={(value) =>
            setCcAgent((current) => ({ ...current, usWorkEligible: value }))
          }
          onSelectRole={handleSelectRole}
          currentAnswer={currentAnswer}
          onCurrentAnswerChange={handleCurrentAnswerChange}
          answerError={answerError}
          prefsForm={prefsForm}
          linkedInUrl={linkedInUrl}
          onLinkedInUrlChange={setLinkedInUrl}
          resumeText={resumeText}
          resumeFileName={resumeFileName}
          onResumeFile={readResumeFile}
          isReadingResume={isReadingResume}
          profileCompleteForGenerate={profileCompleteForGenerate}
          profileIncompleteHint={PROFILE_GATE_HINT}
          profileInsight={profileInsight}
          wizardAnswers={wizardAnswers}
          quizIndex={ccAgent.quizIndex}
          onBack={handleBack}
          onNext={() => void handleNext()}
          onGenerate={() => void handleGenerateBrief()}
          isGenerating={isGenerating}
          isParsingProfile={isParsingProfile}
          isRunningTriage={isRunningTriage}
        />
      ) : null}
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

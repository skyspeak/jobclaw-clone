"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  type VettedRoleId,
  type VettingResult,
} from "@/lib/cc-agent-flow";
import {
  advanceCcAgentState,
  advanceFromDreamJob,
  advanceFromProfileUpload,
  canProceedFromStep,
  retreatCcAgentState,
} from "@/lib/cc-agent-intake-nav";
import { getFlowProgressIndex, getTotalFlowSteps, inferSelectedRoleId } from "@/lib/cc-agent-flow";
import { projectSprintPathForRoleId } from "@/lib/ai-tracks-data";
import {
  buildResumeSnapshot,
  clearAllBrowserOnboardingState,
  hasMinimumProfileEvidence,
  hasResumeOrLinkedInInput,
  INTAKE_WIZARD_STORAGE_KEY,
  readIntakeSession,
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

const PROFILE_GATE_HINT =
  "Add your LinkedIn profile URL or upload a text-based résumé before continuing.";

type ChatIntakeProps = {
  variant?: "wizard" | "chat";
};

function hasIntakeProgress(session: IntakeWizardSession) {
  return (
    session.ccAgent.flowStep !== "target-job-url" ||
    session.ccAgent.skippedProfileUpload ||
    session.ccAgent.knowsTargetJob !== null ||
    session.wizardAnswers.some((answer) => answer.trim().length > 0) ||
    Boolean(session.linkedInUrl.trim() || session.resumeText.trim() || session.targetJobUrl.trim())
  );
}

function resolveProjectSprintHref(input: {
  ccAgent: CcAgentFlowState;
  profileInsight: ParsedProfileInsight | null;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeText: string;
  wizardAnswers: string[];
}): string {
  const vettedRole = input.ccAgent.vettingResult?.inferredRoleId;
  if (vettedRole && vettedRole !== "long-tail") {
    return projectSprintPathForRoleId(vettedRole);
  }

  const roleId = inferSelectedRoleId({
    targetJobUrl: input.targetJobUrl,
    linkedInUrl: input.linkedInUrl,
    resumeText: input.resumeText,
    profileInsight: input.profileInsight,
    answers: wizardRowsToIntakeAnswers(input.wizardAnswers),
  });

  return projectSprintPathForRoleId(roleId);
}

export function ChatIntake({ variant = "chat" }: ChatIntakeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freshSession = readFreshSession();
  const [isHydrated, setIsHydrated] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submissionId, setSubmissionId] = useState(freshSession.submissionId);
  const [ccAgent, setCcAgent] = useState<CcAgentFlowState>(freshSession.ccAgent);
  const [targetJobUrl, setTargetJobUrl] = useState(freshSession.targetJobUrl);
  const [wizardStep, setWizardStep] = useState(freshSession.wizardStep);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>(freshSession.wizardAnswers);
  const [currentAnswer, setCurrentAnswer] = useState(freshSession.currentAnswer);
  const [answerError, setAnswerError] = useState("");
  const [contact, setContact] = useState<IntakeContactInfo>(freshSession.contact);
  const [defaults, setDefaults] = useState<SearchDefaults>(freshSession.defaults);
  const [result, setResult] = useState<JobClawResponse | null>(freshSession.result);
  const [profileDraft, setProfileDraft] = useState<IntakeProfileDraft | null>(
    freshSession.profileDraft,
  );
  const [generatedResume] = useState<GeneratedResume | null>(freshSession.generatedResume);
  const [linkedInUrl, setLinkedInUrl] = useState(freshSession.linkedInUrl);
  const [resumeText, setResumeText] = useState(freshSession.resumeText);
  const [resumeFileName, setResumeFileName] = useState(freshSession.resumeFileName);
  const [isReadingResume, setIsReadingResume] = useState(false);
  const [isParsingProfile, setIsParsingProfile] = useState(false);
  const [isRunningTriage, setIsRunningTriage] = useState(false);
  const [profileInsight, setProfileInsight] = useState<ParsedProfileInsight | null>(null);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const prefsForm = useForm<PrefsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: searchDefaultsToPrefsValues(freshSession.defaults),
  });

  const totalSteps = getTotalFlowSteps(ccAgent);
  const progressStep = getFlowProgressIndex(ccAgent);
  const flowStep = ccAgent.flowStep;

  const profileCompleteForGenerate = useMemo(
    () => ccAgent.skippedProfileUpload || hasMinimumProfileEvidence(linkedInUrl, resumeText),
    [ccAgent.skippedProfileUpload, linkedInUrl, resumeText],
  );

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      clearAllBrowserOnboardingState();
      setSubmissionId("");
      setCcAgent(defaultCcAgentFlowState());
      setTargetJobUrl("");
      setWizardStep(0);
      setWizardAnswers(Array.from({ length: 5 }, () => ""));
      setCurrentAnswer("");
      setAnswerError("");
      setContact(emptyContact);
      setDefaults(defaultSearchDefaults);
      setResult(null);
      setProfileDraft(null);
      setLinkedInUrl("");
      setResumeText("");
      setResumeFileName("");
      setProfileInsight(null);
      setError("");
      setQuizStarted(false);
      prefsForm.reset(searchDefaultsToPrefsValues(defaultSearchDefaults));
      setIsHydrated(true);
      router.replace("/intake");
      return;
    }

    const session = readIntakeSession();
    setSubmissionId(session.submissionId);
    setCcAgent(session.ccAgent);
    setTargetJobUrl(session.targetJobUrl);
    setWizardStep(session.wizardStep);
    setWizardAnswers(session.wizardAnswers);
    setCurrentAnswer(session.currentAnswer);
    setContact(session.contact);
    setDefaults(session.defaults);
    setResult(session.result);
    setProfileDraft(session.profileDraft);
    setLinkedInUrl(session.linkedInUrl);
    setResumeText(session.resumeText);
    setResumeFileName(session.resumeFileName);
    prefsForm.reset(searchDefaultsToPrefsValues(session.defaults));
    setQuizStarted(hasIntakeProgress(session));
    setIsHydrated(true);
  }, [prefsForm, router, searchParams]);

  useEffect(() => {
    if (!isHydrated || searchParams.get("reset") === "1") {
      return;
    }

    if (result?.searchRequest) {
      router.replace("/intake/brief");
    }
  }, [isHydrated, result, router, searchParams]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
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
    isHydrated,
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
        suggestedRoleId?: VettedRoleId | "long-tail";
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
        selectedRoleId:
          payload.suggestedRoleId || payload.vetting.inferredRoleId || current.selectedRoleId,
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
    if (flowStep === "vetting-result") {
      const href = resolveProjectSprintHref({
        ccAgent,
        profileInsight,
        targetJobUrl,
        linkedInUrl,
        resumeText,
        wizardAnswers,
      });
      router.push(href);
      return;
    }

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

    if (flowStep === "target-job-url") {
      const { next, nextCurrentAnswer } = advanceFromDreamJob(ccAgent, targetJobUrl, wizardAnswers);
      setCcAgent(next);
      setCurrentAnswer(nextCurrentAnswer);
      return;
    }

    if (flowStep === "profile-upload") {
      const { next, nextCurrentAnswer } = advanceFromProfileUpload(ccAgent);
      let merged = next;

      if (next.flowStep === "vetting-result" && !next.vettingResult) {
        const vetting = await runTriage();
        if (!vetting) {
          return;
        }
        merged = { ...next, vettingResult: vetting };
      }

      setCcAgent(merged);
      setCurrentAnswer(nextCurrentAnswer);
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

    if (next.flowStep === "search-filters" && !profileInsight && !ccAgent.skippedProfileUpload) {
      const ok = await parseProfileForFilters();
      if (!ok) {
        return;
      }
    }

    setWizardAnswers(nextWizardAnswers);
    setCcAgent(merged);
    setCurrentAnswer(nextCurrentAnswer);
  }

  function handleSkipProfileUpload() {
    setAnswerError("");
    setCcAgent((current) => ({
      ...current,
      skippedProfileUpload: true,
    }));
  }

  function handleBack() {
    if (flowStep === "target-job-url") {
      return;
    }

    setAnswerError("");
    const { next, nextCurrentAnswer } = retreatCcAgentState(ccAgent, wizardAnswers, currentAnswer);
    setCcAgent(next);
    setCurrentAnswer(nextCurrentAnswer);
  }

  function handleNoDreamJob() {
    setAnswerError("");
    setTargetJobUrl("");
    setCcAgent((current) => ({ ...current, knowsTargetJob: false }));
  }

  function handleTargetJobUrlChange(value: string) {
    setTargetJobUrl(value);
    if (value.trim()) {
      setCcAgent((current) =>
        current.knowsTargetJob === false ? { ...current, knowsTargetJob: null } : current,
      );
    }
  }

  function handleSelectRole(_roleId: string) {
    // Role is inferred from profile; manual selection removed.
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

  if (!isHydrated) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden brand-bg selection:bg-primary selection:text-primary-foreground" />
    );
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
    <div className="flex h-[100dvh] flex-col overflow-hidden brand-bg selection:bg-primary selection:text-primary-foreground">
      {error ? (
        <p className="mx-auto w-full max-w-2xl shrink-0 px-4 pt-4 text-sm font-medium text-destructive sm:px-6">
          {error}
        </p>
      ) : null}
      {variant === "chat" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatIntakeConversation
          flowStep={flowStep}
          progressStep={progressStep}
          totalSteps={totalSteps}
          ccAgent={ccAgent}
          targetJobUrl={targetJobUrl}
          onTargetJobUrlChange={handleTargetJobUrlChange}
          onNoDreamJob={handleNoDreamJob}
          onSelectRole={handleSelectRole}
          onSkipProfileUpload={handleSkipProfileUpload}
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
        </div>
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

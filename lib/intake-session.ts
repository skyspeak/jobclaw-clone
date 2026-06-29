import {
  defaultCcAgentFlowState,
  type CcAgentFlowState,
  type CcAgentStepId,
} from "@/lib/cc-agent-flow";
import {
  buildSearchQueryFromRequest,
  defaultSearchDefaults,
  type IntakeAnswers,
  type JobClawResponse,
  type SearchDefaults,
  type SearchRequest,
} from "@/lib/jobclaw";
import type { GeneratedResume } from "@/lib/resume";
import type { ResumeSnapshot } from "@/lib/submissions";

export const INTAKE_WIZARD_STORAGE_KEY = "jobclaw.intake-wizard.v4";

/** Prior wizard keys cleared on full browser reset. */
export const LEGACY_INTAKE_WIZARD_KEYS = [
  "jobclaw.intake-wizard.v2",
  "jobclaw.intake-wizard.v3",
  INTAKE_WIZARD_STORAGE_KEY,
] as const;

export const BROWSER_ONBOARDING_STORAGE_KEYS = [
  ...LEGACY_INTAKE_WIZARD_KEYS,
  "jobclaw.turn-taking-session.v1",
  "jobclaw.matched-internships.v1",
  "jobclaw.project-sprints.v1",
  "dearcc.stay-relevant.contact.v1",
] as const;

export const BROWSER_ONBOARDING_SESSION_KEYS = [] as const;

export type IntakeContactInfo = {
  raw: string;
  name: string;
  email: string;
  phone: string;
};

export type IntakeProfileDraft = {
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

export type IntakeWizardSession = {
  submissionId: string;
  wizardStep: number;
  wizardAnswers: string[];
  currentAnswer: string;
  contact: IntakeContactInfo;
  defaults: SearchDefaults;
  result: JobClawResponse | null;
  profileDraft: IntakeProfileDraft | null;
  generatedResume: GeneratedResume | null;
  linkedInUrl: string;
  resumeText: string;
  resumeFileName: string;
  /** dear[CC] flow (triage → vetting → nurture) */
  ccAgent: CcAgentFlowState;
  targetJobUrl: string;
};

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
  answers?: Partial<IntakeAnswers>;
  currentStep?: number;
};

export function readFreshIntakeSession(): IntakeWizardSession {
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

export function readIntakeSession(): IntakeWizardSession {
  const fallback = readFreshIntakeSession();

  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(INTAKE_WIZARD_STORAGE_KEY);

  if (!stored) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(stored) as LegacyStoredSession;
    const next = readFreshIntakeSession();

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
      skippedProfileUpload: Boolean(parsed.ccAgent?.skippedProfileUpload),
    };

    if (
      Boolean(parsed.ccAgent?.skippedProfileUpload) &&
      parsed.ccAgent?.knowsTargetJob == null &&
      !next.targetJobUrl.trim()
    ) {
      next.ccAgent.knowsTargetJob = false;
      next.ccAgent.skippedProfileUpload = false;
      next.ccAgent.flowStep = "target-job-url";
    }
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

    if (parsed.ccAgent?.flowStep) {
      next.ccAgent.flowStep = parsed.ccAgent.flowStep as CcAgentStepId;
    } else if (typeof parsed.wizardStep === "number") {
      next.wizardStep = Math.min(Math.max(parsed.wizardStep, 0), 6);
      next.ccAgent.flowStep = legacyWizardStepToFlowStep(parsed.wizardStep);
    } else if (typeof parsed.currentStep === "number") {
      const cs = parsed.currentStep;
      next.wizardStep = cs <= 4 ? cs : 5;
      next.ccAgent.flowStep = legacyWizardStepToFlowStep(next.wizardStep);
    }

    next.currentAnswer =
      typeof parsed.currentAnswer === "string"
        ? parsed.currentAnswer
        : (next.wizardAnswers[next.wizardStep] ?? "");

    next.ccAgent.targetJobUrl = next.targetJobUrl;

    if (
      next.ccAgent.knowsTargetJob !== false &&
      (next.ccAgent.flowStep === "target-job-url" || next.ccAgent.flowStep === "profile-upload")
    ) {
      next.ccAgent.flowStep = "connect";
    }

    if (next.ccAgent.knowsTargetJob === null && next.targetJobUrl.trim()) {
      next.ccAgent.knowsTargetJob = true;
    }
    if (next.ccAgent.knowsTargetJob === null && next.ccAgent.flowStep === "quiz") {
      next.ccAgent.knowsTargetJob = false;
    }
    if (
      next.ccAgent.knowsTargetJob === null &&
      next.wizardAnswers.some((answer) => answer.trim()) &&
      !next.targetJobUrl.trim()
    ) {
      next.ccAgent.knowsTargetJob = false;
    }
    if (next.ccAgent.knowsTargetJob === null && next.ccAgent.flowStep !== "connect" && next.ccAgent.flowStep !== "target-job-url") {
      next.ccAgent.flowStep = next.targetJobUrl.trim() ? "connect" : "target-job-url";
    }

    next.ccAgent.flowStep = normalizeLegacyFlowStep(
      next.ccAgent.flowStep,
      next.ccAgent.vettingResult,
    );

    return next;
  } catch {
    window.localStorage.removeItem(INTAKE_WIZARD_STORAGE_KEY);
    return fallback;
  }
}

export function writeIntakeSession(session: IntakeWizardSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTAKE_WIZARD_STORAGE_KEY, JSON.stringify(session));
}

export function clearIntakeSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of LEGACY_INTAKE_WIZARD_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export function clearAllBrowserOnboardingState(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of BROWSER_ONBOARDING_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }

  for (const key of BROWSER_ONBOARDING_SESSION_KEYS) {
    window.sessionStorage.removeItem(key);
  }

  document.cookie = "jobclaw-admin=; Max-Age=0; path=/; SameSite=Lax";
}

export function buildResumeSnapshot(
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

  if (u) snapshot.linkedInUrl = u;
  if (t) snapshot.resumeText = t;
  if (f) snapshot.resumeFileName = f;

  return snapshot;
}

export function hasMinimumProfileEvidence(
  linkedInUrl: string,
  resumeText: string,
  _email?: string,
  _phone?: string,
): boolean {
  return linkedInUrl.trim().length > 0 || resumeText.trim().length > 0;
}

function normalizeLegacyFlowStep(
  step: CcAgentStepId,
  vettingResult: CcAgentFlowState["vettingResult"],
): CcAgentStepId {
  if (
    step === ("hook" as CcAgentStepId) ||
    step === "search-filters" ||
    step === "role-suggestions" ||
    step === ("nurture-track" as CcAgentStepId)
  ) {
    return vettingResult ? "vetting-result" : "connect";
  }

  return step;
}

function legacyWizardStepToFlowStep(wizardStep: number): CcAgentStepId {
  if (wizardStep <= 4) {
    return "quiz";
  }
  if (wizardStep === 5) {
    return "profile-upload";
  }
  return "vetting-result";
}

export function hasResumeOrLinkedInInput(
  linkedInUrl: string,
  resumeText: string,
  resumeFileName: string,
): boolean {
  return linkedInUrl.trim().length > 0 || resumeText.trim().length > 0 || resumeFileName.trim().length > 0;
}

export function buildGoogleAiModeUrl(searchRequest: SearchRequest): string {
  const params = new URLSearchParams({
    q: `${buildSearchQueryFromRequest(searchRequest)} job posting`,
    udm: "50",
    sourceid: "chrome",
    cs: "1",
    hl: "en-US",
  });

  return `https://www.google.com/search?${params.toString()}`;
}

export function buildBriefShareText(
  profile: IntakeProfileDraft | null,
  summary: string | undefined,
): string {
  const lines: string[] = ["My dear[CC] brief"];

  if (profile?.archetype.name) {
    lines.push("", `${profile.archetype.name}`, profile.archetype.summary);
  }

  if (profile?.idealJob.title) {
    lines.push("", `Ideal role: ${profile.idealJob.title}`, profile.idealJob.why);
  }

  if (profile?.linkedInProfile.headline) {
    lines.push("", profile.linkedInProfile.headline, profile.linkedInProfile.about);
  }

  if (summary?.trim()) {
    lines.push("", summary.trim());
  }

  return lines.join("\n").trim();
}

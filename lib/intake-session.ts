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

export const INTAKE_WIZARD_STORAGE_KEY = "jobclaw.intake-wizard.v2";

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
      next.wizardStep = cs <= 4 ? cs : 5;
    }

    next.currentAnswer =
      typeof parsed.currentAnswer === "string"
        ? parsed.currentAnswer
        : (next.wizardAnswers[next.wizardStep] ?? "");

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

  window.localStorage.removeItem(INTAKE_WIZARD_STORAGE_KEY);
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
  const lines: string[] = ["My JobClaw brief"];

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

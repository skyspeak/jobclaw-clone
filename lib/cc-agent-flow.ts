/**
 * dear[CC] intake flow: triage → vetting → project sprint.
 * @see Product spec: dear[CC] — Land Your First Job
 */

import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import type { IntakeAnswers } from "@/lib/jobclaw";
import type { ProfileGapParameter } from "@/lib/profile-gaps";
import type { ParsedProfileInsight } from "@/lib/profile-parse";

export const VETTED_ROLE_IDS = ["sales", "marketing", "fde", "swe"] as const;
export type VettedRoleId = (typeof VETTED_ROLE_IDS)[number];

export type NurtureTrackId =
  | "mentorship-team"
  | "skill-up-team"
  | "self-serve-long-tail"
  | "quiz-to-track";

export type CcAgentStepId =
  | "connect"
  | "target-job-url"
  | "profile-upload"
  | "resume"
  | "linkedin"
  | "quiz"
  | "role-suggestions"
  | "vetting-result"
  | "unlock-roadmap"
  | "roadmap"
  | "journey"
  | "search-filters";

export const INTAKE_STEP_LABELS = ["Connect", "Your analysis", "Your roadmap"] as const;

export function getIntakeTopLevelStep(flowStep: CcAgentStepId): 1 | 2 | 3 {
  if (flowStep === "roadmap" || flowStep === "journey") {
    return 3;
  }
  if (flowStep === "vetting-result" || flowStep === "unlock-roadmap") {
    return 2;
  }
  return 1;
}

/** Flow step to show when the user selects a top-level stage in the header. */
export function getFlowStepForIntakeTopLevel(
  topLevel: 1 | 2 | 3,
  state: CcAgentFlowState,
): CcAgentStepId {
  if (topLevel === 2) {
    return state.flowStep === "unlock-roadmap" ? "unlock-roadmap" : "vetting-result";
  }
  if (topLevel === 3) {
    return state.personalizedRoadmap || state.roadmapUnlocked ? "roadmap" : "journey";
  }

  if (resolveKnowsTargetJob(state) !== false) {
    if (state.flowStep === "linkedin" || state.flowStep === "target-job-url") {
      return state.flowStep;
    }
    return "linkedin";
  }

  if (
    state.flowStep === "linkedin" ||
    state.flowStep === "target-job-url" ||
    state.flowStep === "quiz" ||
    state.flowStep === "profile-upload"
  ) {
    return state.flowStep;
  }

  return "linkedin";
}

export function canNavigateToIntakeTopLevel(
  topLevel: 1 | 2 | 3,
  state: CcAgentFlowState,
): boolean {
  if (topLevel === 3 && state.roadmapUnlocked && state.vettingResult) {
    return true;
  }

  const maxUnlocked = getIntakeTopLevelStep(state.flowStep);
  if (topLevel > maxUnlocked) {
    return false;
  }
  if (topLevel >= 2 && !state.vettingResult) {
    return false;
  }
  return true;
}

export const DREAM_JOB_SKIP_CHIP = "I don't have a job URL";
export const PROFILE_SKIP_CHIP = "I don't have a LinkedIn or résumé yet";
export const QUIZ_PATH_INTRO = "Let's figure out some good options for you";

export type VettingResult = {
  vetted: boolean;
  quantitativeSignal: boolean;
  roleVetted: boolean;
  profileStrength: "strong" | "gap";
  inferredRoleId: VettedRoleId | "long-tail";
  inferredRoleLabel: string;
  nurtureTrack: NurtureTrackId;
  summary: string;
  gapParameters: ProfileGapParameter[];
};

export type CcAgentFlowState = {
  knowsTargetJob: boolean | null;
  skippedProfileUpload: boolean;
  targetJobUrl: string;
  selectedRoleId: string;
  flowStep: CcAgentStepId;
  quizIndex: number;
  vettingResult: VettingResult | null;
  roleSuggestions: string[];
  personalizedRoadmap: IntakePersonalizedRoadmap | null;
  roadmapUnlocked: boolean;
};

export const CC_AGENT_ROLE_LABELS: Record<VettedRoleId, string> = {
  sales: "Sales",
  marketing: "Marketing",
  fde: "Forward Deployed Engineer",
  swe: "Software Engineer",
};

export const NURTURE_TRACK_COPY: Record<
  NurtureTrackId,
  { title: string; description: string; ctaHref: string; ctaLabel: string }
> = {
  "mentorship-team": {
    title: "Mentorship + team project",
    description:
      "You’re vetted with a strong profile match. Next: a 4-week team sprint with peers, a mentor, and a public proof-of-work artifact.",
    ctaHref: "/project-sprints",
    ctaLabel: "View your sprint",
  },
  "skill-up-team": {
    title: "Skill-up + team project",
    description:
      "You have a vetted target role but a profile gap. CC-curated skill-up content, then a team project and re-evaluation for mentorship.",
    ctaHref: "/project-sprints",
    ctaLabel: "View your sprint",
  },
  "self-serve-long-tail": {
    title: "Your next steps",
    description:
      "We'll help you close the gap between your target role and your profile with a focused plan and resources.",
    ctaHref: "/project-sprints",
    ctaLabel: "Explore project sprints",
  },
  "quiz-to-track": {
    title: "Role discovery → track",
    description:
      "You weren’t sure of a target role. Pick a suggested role below, then we’ll route you into the right nurture path.",
    ctaHref: "/project-sprints",
    ctaLabel: "Explore project sprints",
  },
};

export function defaultCcAgentFlowState(): CcAgentFlowState {
  return {
    knowsTargetJob: null,
    skippedProfileUpload: false,
    targetJobUrl: "",
    selectedRoleId: "",
    flowStep: "linkedin",
    quizIndex: 0,
    vettingResult: null,
    roleSuggestions: [],
    personalizedRoadmap: null,
    roadmapUnlocked: false,
  };
}

/** Infer dream-job path when session state was restored without knowsTargetJob. */
export function resolveKnowsTargetJob(state: CcAgentFlowState): boolean | null {
  if (state.knowsTargetJob !== null) {
    return state.knowsTargetJob;
  }

  if (state.targetJobUrl.trim()) {
    return true;
  }

  if (state.flowStep === "quiz") {
    return false;
  }

  return null;
}

export function isQuizPath(state: CcAgentFlowState): boolean {
  return resolveKnowsTargetJob(state) === false;
}

const POST_PROFILE_STEPS: CcAgentStepId[] = ["vetting-result", "journey"];

export function getFlowStepSequence(state: CcAgentFlowState): CcAgentStepId[] {
  const knowsTargetJob = resolveKnowsTargetJob(state);

  if (knowsTargetJob === null) {
    return ["linkedin", "target-job-url"];
  }

  if (knowsTargetJob === false) {
    return ["linkedin", "target-job-url", "quiz", "profile-upload", ...POST_PROFILE_STEPS];
  }

  return ["linkedin", "target-job-url", ...POST_PROFILE_STEPS];
}

export function getTotalFlowSteps(state: CcAgentFlowState): number {
  const base = getFlowStepSequence(state).length;
  if (isQuizPath(state)) {
    return base + 4;
  }
  return base;
}

export function getFlowProgressIndex(state: CcAgentFlowState): number {
  const sequence = getFlowStepSequence(state);
  const stepIndex = sequence.indexOf(state.flowStep);
  if (stepIndex < 0) {
    return 1;
  }

  if (state.flowStep === "quiz" && isQuizPath(state)) {
    return stepIndex + 1 + state.quizIndex;
  }

  return stepIndex + 1;
}

export function getNextFlowStep(state: CcAgentFlowState): CcAgentStepId | null {
  if (state.flowStep === "quiz" && isQuizPath(state)) {
    if (state.quizIndex < 4) {
      return "quiz";
    }
  }

  const sequence = getFlowStepSequence(state);
  const index = sequence.indexOf(state.flowStep);
  if (index < 0 || index >= sequence.length - 1) {
    return null;
  }

  return sequence[index + 1] ?? null;
}

export function getPrevFlowStep(state: CcAgentFlowState): CcAgentStepId | null {
  if (state.flowStep === "roadmap") {
    return "vetting-result";
  }

  if (state.flowStep === "unlock-roadmap") {
    return "vetting-result";
  }

  if (state.flowStep === "quiz" && isQuizPath(state) && state.quizIndex > 0) {
    return "quiz";
  }

  const sequence = getFlowStepSequence(state);
  const index = sequence.indexOf(state.flowStep);
  if (index <= 0) {
    return null;
  }

  return sequence[index - 1] ?? null;
}

const ROLE_PATTERNS: Array<{ id: VettedRoleId | "long-tail"; re: RegExp; label: string }> = [
  { id: "fde", re: /forward deployed|fde|solutions engineer|field engineer|customer engineer/i, label: "Forward Deployed Engineer" },
  { id: "swe", re: /software engineer|developer|backend|frontend|full[- ]?stack|swe\b/i, label: "Software Engineer" },
  { id: "marketing", re: /marketing|growth|brand|content|gtm|demand gen/i, label: "Marketing" },
  { id: "sales", re: /sales|account executive|bdr|sdr|business development/i, label: "Sales" },
];

export function inferRoleFromText(...sources: string[]): {
  id: VettedRoleId | "long-tail";
  label: string;
} {
  const corpus = sources.join(" ").toLowerCase();

  for (const { id, re, label } of ROLE_PATTERNS) {
    if (id !== "long-tail" && re.test(corpus)) {
      return { id, label };
    }
  }

  return { id: "long-tail", label: "Role outside MVP vetted set" };
}

/** Infer MVP target role from dream job, profile parse, résumé, or quiz — no manual pick. */
export function inferSelectedRoleId(input: {
  targetJobUrl: string;
  linkedInUrl: string;
  resumeText: string;
  profileInsight: ParsedProfileInsight | null;
  answers: IntakeAnswers;
}): VettedRoleId | "long-tail" {
  if (input.targetJobUrl.trim()) {
    const fromTarget = inferRoleFromText(input.targetJobUrl);
    if (fromTarget.id !== "long-tail") {
      return fromTarget.id;
    }
  }

  for (const role of input.profileInsight?.suggestedRoles ?? []) {
    const fromInsight = inferRoleFromText(role);
    if (fromInsight.id !== "long-tail") {
      return fromInsight.id;
    }
  }

  const fromCorpus = inferRoleFromText(
    input.resumeText,
    input.linkedInUrl,
    input.answers.q1,
    input.answers.q2,
    input.answers.q3,
    input.answers.q4,
    input.answers.q5,
  );

  return fromCorpus.id;
}

function hasQuantitativeSignal(resumeText: string, answers: IntakeAnswers): boolean {
  const corpus = [resumeText, answers.q2, answers.q5].join(" ").toLowerCase();
  const signals = [
    /\b(gpa|3\.\d)\b/,
    /\b(b\.?s\.?|b\.?a\.?|m\.?s\.?|ph\.?d)\b/,
    /\b(university|college|stanford|berkeley|mit)\b/,
    /\b(internship|fellowship|research assistant)\b/,
    /\b(lead|president|founder|captain|published)\b/,
    /\b\d+%\b/,
    /\b(raised|built|shipped|launched)\b/,
  ];

  return signals.some((re) => re.test(corpus));
}

function inferProfileStrength(
  profileInsight: ParsedProfileInsight | null,
  hasTargetJob: boolean,
): "strong" | "gap" {
  if (profileInsight?.isLikelyFirstTimeJobSeeker) {
    return "gap";
  }
  if (profileInsight?.isLikelyLongTermUnemployed) {
    return "gap";
  }
  if (!hasTargetJob) {
    return "gap";
  }
  return "strong";
}

export function assignNurtureTrack(input: {
  knowsTargetJob: boolean;
  vetted: boolean;
  profileStrength: "strong" | "gap";
  roleId: VettedRoleId | "long-tail";
  selectedRoleId: string;
}): NurtureTrackId {
  if (!input.knowsTargetJob && !input.selectedRoleId.trim()) {
    return "quiz-to-track";
  }

  if (!input.vetted || input.roleId === "long-tail") {
    return "self-serve-long-tail";
  }

  if (input.profileStrength === "gap") {
    return "skill-up-team";
  }

  return "mentorship-team";
}

export function runVetting(input: {
  knowsTargetJob: boolean;
  resumeText: string;
  linkedInUrl: string;
  targetJobUrl: string;
  selectedRoleId: string;
  answers: IntakeAnswers;
  profileInsight: ParsedProfileInsight | null;
  roleSuggestions: string[];
}): VettingResult {
  const corpus = [
    input.resumeText,
    input.linkedInUrl,
    input.targetJobUrl,
    input.selectedRoleId,
    ...input.roleSuggestions,
    input.answers.q1,
    input.answers.q3,
  ].join(" ");

  const role = input.selectedRoleId
    ? inferRoleFromText(input.selectedRoleId, CC_AGENT_ROLE_LABELS[input.selectedRoleId as VettedRoleId] ?? "")
    : inferRoleFromText(corpus);

  const quantitativeSignal = hasQuantitativeSignal(input.resumeText, input.answers);
  const roleVetted = role.id !== "long-tail";
  const profileStrength = inferProfileStrength(input.profileInsight, input.knowsTargetJob && Boolean(input.targetJobUrl.trim()));

  const vetted = quantitativeSignal && roleVetted;

  const nurtureTrack = assignNurtureTrack({
    knowsTargetJob: input.knowsTargetJob,
    vetted,
    profileStrength,
    roleId: role.id,
    selectedRoleId: input.selectedRoleId,
  });

  const summary = vetted
    ? `Aligned for ${role.label}.`
    : "";

  return {
    vetted,
    quantitativeSignal,
    roleVetted,
    profileStrength,
    inferredRoleId: role.id,
    inferredRoleLabel: role.label,
    nurtureTrack,
    summary,
    gapParameters: [],
  };
}

export function buildRoleSuggestions(
  profileInsight: ParsedProfileInsight | null,
  vetting: VettingResult,
): string[] {
  const fromInsight = profileInsight?.suggestedRoles ?? [];
  const defaults = ["Marketing", "Forward Deployed Engineer", "Software Engineer", "Sales"];
  const merged = [...fromInsight];

  for (const role of defaults) {
    if (!merged.some((r) => r.toLowerCase().includes(role.toLowerCase()))) {
      merged.push(role);
    }
  }

  if (vetting.inferredRoleLabel && vetting.inferredRoleId !== "long-tail") {
    merged.unshift(vetting.inferredRoleLabel);
  }

  return [...new Set(merged)].slice(0, 5);
}


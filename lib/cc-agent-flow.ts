/**
 * dear[CC] intake flow: triage → vetting → nurture track → proof-of-work path.
 * @see Product spec: dear[CC] — Land Your First Job
 */

import type { IntakeAnswers } from "@/lib/jobclaw";
import type { ParsedProfileInsight } from "@/lib/profile-parse";

export const VETTED_ROLE_IDS = ["sales", "marketing", "fde", "swe"] as const;
export type VettedRoleId = (typeof VETTED_ROLE_IDS)[number];

export type NurtureTrackId =
  | "mentorship-team"
  | "skill-up-team"
  | "self-serve-long-tail"
  | "quiz-to-track";

export type CcAgentStepId =
  | "hook"
  | "target-job-url"
  | "resume"
  | "linkedin"
  | "quiz"
  | "role-suggestions"
  | "vetting-result"
  | "nurture-track"
  | "search-filters";

export type VettingResult = {
  vetted: boolean;
  usWorkEligible: boolean;
  quantitativeSignal: boolean;
  roleVetted: boolean;
  profileStrength: "strong" | "gap";
  inferredRoleId: VettedRoleId | "long-tail";
  inferredRoleLabel: string;
  nurtureTrack: NurtureTrackId;
  summary: string;
};

export type CcAgentFlowState = {
  knowsTargetJob: boolean | null;
  targetJobUrl: string;
  selectedRoleId: string;
  usWorkEligible: boolean;
  flowStep: CcAgentStepId;
  quizIndex: number;
  vettingResult: VettingResult | null;
  roleSuggestions: string[];
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
    ctaLabel: "View project sprints",
  },
  "skill-up-team": {
    title: "Skill-up + team project",
    description:
      "You have a vetted target role but a profile gap. CC-curated skill-up content, then a team project and re-evaluation for mentorship.",
    ctaHref: "/project-sprints",
    ctaLabel: "View project sprints",
  },
  "self-serve-long-tail": {
    title: "Self-serve gap plan",
    description:
      "Your target sits outside our MVP vetted roles (Sales, Marketing, FDE, SWE). You’ll get a Claude-driven gap diff and resource list; community is optional.",
    ctaHref: "/intake/brief",
    ctaLabel: "Continue to your brief",
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
    targetJobUrl: "",
    selectedRoleId: "",
    usWorkEligible: false,
    flowStep: "hook",
    quizIndex: 0,
    vettingResult: null,
    roleSuggestions: [],
  };
}

export function getFlowStepSequence(knowsTargetJob: boolean | null): CcAgentStepId[] {
  if (knowsTargetJob === null) {
    return ["hook"];
  }

  if (knowsTargetJob) {
    return [
      "hook",
      "target-job-url",
      "resume",
      "linkedin",
      "role-suggestions",
      "vetting-result",
      "nurture-track",
      "search-filters",
    ];
  }

  return [
    "hook",
    "resume",
    "quiz",
    "role-suggestions",
    "linkedin",
    "vetting-result",
    "nurture-track",
    "search-filters",
  ];
}

export function getTotalFlowSteps(knowsTargetJob: boolean | null): number {
  const base = getFlowStepSequence(knowsTargetJob).length;
  if (knowsTargetJob === false) {
    return base + 4;
  }
  return base;
}

export function getFlowProgressIndex(state: CcAgentFlowState): number {
  const sequence = getFlowStepSequence(state.knowsTargetJob);
  const stepIndex = sequence.indexOf(state.flowStep);
  if (stepIndex < 0) {
    return 1;
  }

  if (state.flowStep === "quiz" && state.knowsTargetJob === false) {
    return stepIndex + 1 + state.quizIndex;
  }

  return stepIndex + 1;
}

export function getNextFlowStep(state: CcAgentFlowState): CcAgentStepId | null {
  if (state.flowStep === "quiz" && state.knowsTargetJob === false) {
    if (state.quizIndex < 4) {
      return "quiz";
    }
  }

  const sequence = getFlowStepSequence(state.knowsTargetJob);
  const index = sequence.indexOf(state.flowStep);
  if (index < 0 || index >= sequence.length - 1) {
    return null;
  }

  return sequence[index + 1] ?? null;
}

export function getPrevFlowStep(state: CcAgentFlowState): CcAgentStepId | null {
  if (state.flowStep === "quiz" && state.knowsTargetJob === false && state.quizIndex > 0) {
    return "quiz";
  }

  const sequence = getFlowStepSequence(state.knowsTargetJob);
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
  usWorkEligible: boolean;
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

  const vetted =
    input.usWorkEligible && quantitativeSignal && roleVetted;

  const nurtureTrack = assignNurtureTrack({
    knowsTargetJob: input.knowsTargetJob,
    vetted,
    profileStrength,
    roleId: role.id,
    selectedRoleId: input.selectedRoleId,
  });

  const summary = vetted
    ? `Vetted for ${role.label} — ${profileStrength === "strong" ? "strong profile fit" : "profile gap to close"}. Mentorship unlocks on the team-project track.`
    : `Not fully vetted for MVP mentorship${!input.usWorkEligible ? " (US work eligibility required for MVP)" : ""}${!quantitativeSignal ? "; add clearer education or impact signals to your résumé" : ""}${!roleVetted ? "; role outside Sales, Marketing, FDE, SWE" : ""}. You can still continue with search filters and your brief.`;

  return {
    vetted,
    usWorkEligible: input.usWorkEligible,
    quantitativeSignal,
    roleVetted,
    profileStrength,
    inferredRoleId: role.id,
    inferredRoleLabel: role.label,
    nurtureTrack,
    summary,
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

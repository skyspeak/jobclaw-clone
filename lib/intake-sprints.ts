import type { IntakeAnswers, SearchRequest } from "@/lib/jobclaw";

export const SPRINT_SESSION_KEY = "jobclaw.project-sprints.v1";

export type SprintSessionPayloadV1 = {
  version: 1;
  searchRequest: SearchRequest;
  answers: IntakeAnswers;
  preferVolunteerRoles?: boolean;
};

export type SprintContext = {
  spaceLane: string;
  roleNorthStar: string;
  keywordsSummary: string;
  strengthSnippet: string;
  energizeSnippet: string;
  avoidSnippet: string;
  momentumSnippet: string;
  preferVolunteer: boolean;
  locationHint: string;
};

export type SprintCardSpec = {
  id: string;
  title: string;
  teaser: string;
  aiForward: string;
  weekOne: string[];
  weekTwo: string[];
  deliverable: string;
};

export function clipText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat || "your story—fill in as you refine it.";
  return `${flat.slice(0, Math.max(0, max - 1))}…`;
}

export function inferSpaceLane(corpus: string, preferVolunteer: boolean): string {
  if (preferVolunteer) {
    return "community programs, volunteers, and mission-driven partnerships";
  }
  const lower = corpus.toLowerCase();

  const lanes: Array<{ re: RegExp; label: string }> = [
    { re: /product|roadmap|user\s+research|ux\s+research|\bpm\b/, label: "product strategy and experimentation" },
    { re: /design|creative|brand|storytelling|visual|prototype/, label: "design, narrative, and creative direction" },
    { re: /market|campaign|growth|content|communication|sales\s+enablement/, label: "marketing stories and stakeholder communications" },
    { re: /data|analytics|systems|operations|automate|\bops\b/, label: "systems, workflows, and data-informed operations" },
    { re: /research|policy|memo|evaluation|survey/, label: "research synthesis and stakeholder memos" },
    { re: /customer\s+success|support|coach|education|trainer|enablement/, label: "delightful onboarding and learner enablement" },
  ];

  for (const { re, label } of lanes) {
    if (re.test(lower)) return label;
  }

  return "early-career problem solving and transferable craft";
}

export function buildSprintContext(
  searchRequest: SearchRequest,
  answers: IntakeAnswers,
  options?: { preferVolunteerRoles?: boolean },
): SprintContext {
  const corpus = [
    answers.q1,
    answers.q2,
    answers.q3,
    answers.q5,
    searchRequest.jobTitle,
    ...searchRequest.keywords,
  ]
    .join(" ")
    .toLowerCase();

  const providerVolunteer =
    Boolean(options?.preferVolunteerRoles) || searchRequest.provider.toLowerCase() === "idealist";

  const spaceLane = inferSpaceLane(corpus, providerVolunteer);
  const roleNorthStar = searchRequest.jobTitle.trim() || "the role family you gravitated toward in the quiz";
  const keywordsSummary =
    searchRequest.keywords.filter(Boolean).slice(0, 5).join(", ") || "skills and themes from your quiz";

  return {
    spaceLane,
    roleNorthStar,
    keywordsSummary,
    strengthSnippet: clipText(answers.q2, 180),
    energizeSnippet: clipText(answers.q3, 180),
    avoidSnippet: clipText(answers.q4, 140),
    momentumSnippet: clipText(answers.q5, 160),
    preferVolunteer: providerVolunteer,
    locationHint: searchRequest.location.trim() || "",
  };
}

export function defaultSprintContext(): SprintContext {
  return {
    spaceLane: "early-career exploration and transferable skills",
    roleNorthStar: "roles that blend curiosity with execution",
    keywordsSummary: "communication, experimentation, stakeholder empathy",
    strengthSnippet:
      "the strengths you quietly bring—pattern spotting, facilitation, simplifying complexity, or relentless follow-through.",
    energizeSnippet: "hands-on puzzles, narratives that move people, or systems you can progressively improve.",
    avoidSnippet:
      "rigid bureaucracy, burnout cultures, work that hides impact, or anything that sidelines your autonomy.",
    momentumSnippet:
      "finishing one polished artifact recruiters can skim in under two minutes, plus a repeatable workflow you trust.",
    preferVolunteer: false,
    locationHint: "",
  };
}

export function getPersonalizedSprintCards(context: SprintContext): SprintCardSpec[] {
  const beneficiary = context.preferVolunteer ? "beneficiaries, donors, and partners" : "customers, execs, and operators";
  const nounSpace = context.preferVolunteer ? "impact programs or coalitions you care about" : "the market space you signaled";

  const lead = `${context.spaceLane} anchored on ${context.roleNorthStar}`;

  return [
    {
      id: "marketing-narrative",
      title: "AI-augmented growth narrative sprint",
      teaser: `Frame how your skills line up with ${lead}.`,
      aiForward:
        `Use AI to draft personas, objections, proof points—then annotate every hallucination-risk line with what you validated yourself. Audience: ${beneficiary}.`,
      weekOne: [
        `Interviews with yourself: pull concrete quotes about ${clipText(context.strengthSnippet, 90)}.`,
        `Prompt ladders for competitive claims in ${nounSpace}; keep a skepticism ledger.`,
      ],
      weekTwo: [
        "Ship final one-pager: promise, pillars, KPIs tied to narratives you want on your portfolio.",
        "Record a three-minute loom voiceover—you explain how AI drafts were edited—not replaced.",
      ],
      deliverable: "Positioning memo + QA’d talking points synced to intake keywords.",
    },
    {
      id: "product-brief",
      title: "Product opportunity & delivery plan sprint",
      teaser: `Translate “${clipText(context.energizeSnippet, 100)}” into a crisp problem statement.`,
      aiForward:
        "Synthetic user comments + synthesized jobs-to-be-done, but every insight footnotes evidence you personally captured.",
      weekOne: [
        `Map stakeholder map for ${lead}; define success metrics.`,
        "AI-assisted storyboard five user vignettes—you cut two that violate your deal-breakers.",
      ],
      weekTwo: [
        "Six-week rollout proposal with humane AI guardrails annotated per step.",
      ],
      deliverable: "Opportunity brief + experiment backlog with risk/mitigation pairing.",
    },
    {
      id: "design-brief",
      title: "Design direction & critique pack sprint",
      teaser: "Turn messy inspiration into directional frames hiring managers skim fast.",
      aiForward:
        "Generate divergent comps + mood palettes; your job is curation plus critique rubrics that prove taste.",
      weekOne: [
        `Collect inspirations tied to keywords: ${clipText(context.keywordsSummary, 120)}.`,
      ],
      weekTwo: [
        "Ship annotated Figma/low-fi deck calling out typography, pacing, inclusivity checkpoints.",
      ],
      deliverable: "Design critique doc + prioritized next experiments.",
    },
    {
      id: "operations-automation",
      title: "Operations workflow & intelligent handoff blueprint",
      teaser: `Showcase how you tame complexity in ${lead}.`,
      aiForward:
        "Model human + AI RACI lanes; quantify time saved assuming worst-case hallucination rework.",
      weekOne: [
        "Pick one messy workflow anchored in quiz answers.",
        `Flag failure modes stemming from "${clipText(context.avoidSnippet, 80)}".`,
      ],
      weekTwo: [
        "Pilot micro-automation plus rollback script.",
      ],
      deliverable: "Workflow map + playbook for responsible automation.",
    },
    {
      id: "research-memo",
      title: "Evidence-backed landscape memo sprint",
      teaser: context.preferVolunteer
        ? "Blend mission metrics with pragmatic funding realism."
        : "Blend credible sources with synthesized POV recruiters can cite.",
      aiForward:
        "Treat AI summarization like an intern—you verify every citation; store prompts + acceptance criteria.",
      weekOne: [
        `Harvest public signals referencing ${lead}.`,
      ],
      weekTwo: [
        `Connect findings to milestone you described: "${clipText(context.momentumSnippet, 120)}".`,
      ],
      deliverable: "5-page synthesis + annotated bibliography + prompting log.",
    },
  ];
}

export const OFFICE_HOURS_NOTE =
  "Each sprint wraps with live office hours: bring your drafts, tooling choices, and what you rewrote manually after AI assistance—mentors critique both the artifact and how you wielded automation.";

type SprintMatch = {
  card: SprintCardSpec;
  reason: string;
};

/**
 * Picks the single best-fit sprint for this candidate's brief.
 * Uses the inferred space lane plus keyword overlap to score each canned sprint
 * and returns the top match. Always returns one sprint (with a fallback rationale).
 */
export function pickSprintForCandidate(context: SprintContext): SprintMatch {
  const cards = getPersonalizedSprintCards(context);
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const corpus =
    `${context.spaceLane} ${context.roleNorthStar} ${context.keywordsSummary} ${context.strengthSnippet} ${context.energizeSnippet} ${context.momentumSnippet}`.toLowerCase();

  const cues: Array<{ id: SprintCardSpec["id"]; terms: string[]; reason: string }> = [
    {
      id: "product-brief",
      terms: ["product", "roadmap", "user research", "ux research", "pm ", "experimentation", "jobs-to-be-done", "stakeholder"],
      reason: "You signaled product framing energy—turning ambiguous problems into shippable bets.",
    },
    {
      id: "design-brief",
      terms: ["design", "creative", "brand", "visual", "prototype", "storytelling", "narrative"],
      reason: "Your answers lean creative/visual, so a critique-pack sprint sharpens taste fast.",
    },
    {
      id: "marketing-narrative",
      terms: ["market", "campaign", "growth", "content", "communication", "audience", "story", "messaging", "sales enablement"],
      reason: "You gravitated toward narrative and stakeholder communication—the growth narrative sprint is the fit.",
    },
    {
      id: "operations-automation",
      terms: ["operations", "ops", "process", "workflow", "automate", "automation", "systems", "data", "analytics", "rituals"],
      reason: "You showed systems-thinking instincts—this sprint demonstrates responsible automation judgment.",
    },
    {
      id: "research-memo",
      terms: ["research", "policy", "memo", "evaluation", "evidence", "synthesis", "writing", "report"],
      reason: "You enjoy synthesizing complexity—an evidence-backed memo proves rigor and POV.",
    },
  ];

  const scored = cues.map((cue) => {
    const score = cue.terms.reduce(
      (count, term) => (corpus.includes(term) ? count + (term.length >= 6 ? 2 : 1) : count),
      0,
    );
    return { ...cue, score };
  });

  scored.sort((left, right) => right.score - left.score);
  const top = scored[0];

  if (top && top.score > 0) {
    const card = cardsById.get(top.id);
    if (card) {
      return { card, reason: top.reason };
    }
  }

  if (context.preferVolunteer) {
    const memo = cardsById.get("research-memo");
    if (memo) {
      return {
        card: memo,
        reason:
          "Mission-driven work tends to need credible synthesis, so we routed you to the evidence memo sprint.",
      };
    }
  }

  const fallback = cardsById.get("marketing-narrative") ?? cards[0];
  return {
    card: fallback,
    reason:
      "Defaulting to the growth narrative sprint—the most transferable launchpad for early-career builders.",
  };
}

export function writeSprintSession(payload: {
  searchRequest: SearchRequest;
  answers: IntakeAnswers;
  preferVolunteerRoles?: boolean;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const body: SprintSessionPayloadV1 = {
    version: 1,
    searchRequest: payload.searchRequest,
    answers: payload.answers,
    preferVolunteerRoles: payload.preferVolunteerRoles,
  };

  sessionStorage.setItem(SPRINT_SESSION_KEY, JSON.stringify(body));
}

export function readSprintSession(): SprintSessionPayloadV1 | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(SPRINT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SprintSessionPayloadV1;
    if (
      parsed?.version !== 1 ||
      !parsed.searchRequest ||
      !parsed.answers ||
      typeof parsed.answers.q1 !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

import type { IntakeAnswers } from "@/lib/jobclaw";

export type SprintSponsor = {
  role: string;
  guide: string;
};

export type MicroInternshipSprint = {
  id: string;
  title: string;
  passionHint: string;
  surveyHooks: {
    q1: string;
    q3: string;
    q5: string;
  };
  businessProblem: string;
  aiLeverage: string;
  deliverables: string[];
  sponsors: SprintSponsor[];
  officeHours: string[];
  /** Lowercase tokens; matched as substrings in q1+q2+q3+q5. */
  matchTerms: string[];
};

export const MICRO_INTERNSHIP_PROGRAM = {
  sprintLength: "2 weeks (10 working days)",
  structure:
    "Week A: discovery and prototype. Week B: ship, measure, and hand off with a playback.",
  timeCommitment: "About 15–20 hours per week.",
  aiExpectations: [
    "Prompt with goal, constraints, examples, and success criteria.",
    "Verify facts, edge cases, and assumptions before shipping.",
    "Minimize sensitive data in tools; follow host privacy rules.",
    "Document what was automated versus human-reviewed.",
  ],
} as const;

export const MICRO_INTERNSHIP_SPRINTS: MicroInternshipSprint[] = [
  {
    id: "research-policy",
    title: "Research and decision memo sprint",
    passionHint:
      "For people who light up on ambiguity, synthesis, and recommendations leadership can act on.",
    surveyHooks: {
      q1: "Your future day involves briefing leaders or shaping strategy.",
      q3: "Research, policy, ideas, or evidence-heavy problems.",
      q5: "Progress looks like a credible memo others actually used.",
    },
    businessProblem:
      "Executives need a tight decision memo on a messy topic—a regulation, market shift, or program tradeoff—and lack time to scan sources.",
    aiLeverage:
      "Use AI for structured comparisons and draft outlines; you own citations, conflicts, and the final recommendation.",
    deliverables: [
      "Problem brief with decision question and success criteria.",
      "Memo or deck appendix with verified sources.",
      "Risk register and next-step recommendations.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Owns the decision and defines ‘good enough’ evidence." },
      { role: "Operator sponsor", guide: "Chief of staff or PM for stakeholder alignment and pacing." },
      { role: "AI practice sponsor", guide: "Reviews retrieval, citation hygiene, and hallucination checks." },
    ],
    officeHours: [
      "Day 5 — Scope and evidence critique.",
      "Day 8 — AI workflow and verification audit.",
      "Day 10 — Demo rehearsal with narrative and metric.",
    ],
    matchTerms: [
      "research",
      "policy",
      "memo",
      "brief",
      "analysis",
      "evidence",
      "strategy",
      "whitepaper",
      "report",
      "synthesis",
    ],
  },
  {
    id: "community-insights",
    title: "Customer and community insight sprint",
    passionHint:
      "For people energized by listening, patterns in messy human feedback, and turning themes into action.",
    surveyHooks: {
      q1: "Your day centers on users, members, or neighbors you truly serve.",
      q3: "Helping people, community programs, support, or qualitative depth.",
      q5: "Progress is a prioritized insight backlog teams adopted.",
    },
    businessProblem:
      "Tickets, chats, or forums show churn or frustration, but themes are unlabeled and nobody agrees on priority.",
    aiLeverage:
      "Use AI to propose themes and draft interview guides; you validate with quotes and spot-check transcripts.",
    deliverables: [
      "Thematic summary with example quotes (permission-aware).",
      "Prioritized opportunity list tied to business metrics.",
      "Lightweight research plan for the next wave.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "CX or community lead who feels the pain daily." },
      { role: "Operator sponsor", guide: "Program manager for cadence and stakeholder readouts." },
      { role: "AI practice sponsor", guide: "Guards PII redaction and thematic coding rigor." },
    ],
    officeHours: [
      "Day 5 — Theme definitions and quote discipline.",
      "Day 8 — Privacy redaction and sampling review.",
      "Day 10 — Playback to stakeholders.",
    ],
    matchTerms: [
      "community",
      "customer",
      "support",
      "ticket",
      "interview",
      "feedback",
      "user",
      "member",
      "volunteer",
      "listening",
      "qualitative",
      "service",
    ],
  },
  {
    id: "ops-data",
    title: "Operations and reporting bottleneck sprint",
    passionHint:
      "For people who like systems, spreadsheets, reliability, and making recurring work disappear responsibly.",
    surveyHooks: {
      q1: "Your day runs on dashboards, schedules, or dependable pipelines.",
      q3: "Data, systems, operations, or automation with guardrails.",
      q5: "Progress is measured hours saved with audited numbers.",
    },
    businessProblem:
      "Weekly reporting eats hours; inputs are exports and spreadsheets with brittle edge cases.",
    aiLeverage:
      "Use AI to draft scripts, specs, and edge-case docs; you run tests on real files and sign off totals.",
    deliverables: [
      "Current-state map of sources and failure modes.",
      "Working MVP script or sheet workflow plus test checklist.",
      "Runbook for owners after you leave.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Ops manager who owns the metric deadlines." },
      { role: "Operator sponsor", guide: "Engineering or analytics IC for feasibility checks." },
      { role: "AI practice sponsor", guide: "Data minimization and test-plan discipline." },
    ],
    officeHours: [
      "Day 5 — Scope freeze and edge-case harvest.",
      "Day 8 — Numeric reconciliation review.",
      "Day 10 — Handoff dry run.",
    ],
    matchTerms: [
      "operations",
      "ops",
      "data",
      "spreadsheet",
      "reporting",
      "automation",
      "systems",
      "pipeline",
      "dashboard",
      "analyst",
      "workflow",
      "process",
    ],
  },
  {
    id: "gtm-experiment",
    title: "Go-to-market experiment sprint",
    passionHint:
      "For builders who love positioning tests, landing pages, and learning fast from real buyers.",
    surveyHooks: {
      q1: "Your day blends storytelling with experiments and revenue curiosity.",
      q3: "Creative work paired with growth, sales, or startup pace.",
      q5: "Progress is a validated learning with numbers behind it.",
    },
    businessProblem:
      "The team cannot tell which message or channel produces qualified conversations.",
    aiLeverage:
      "Use AI for variant matrices and copy drafts; you own measurement, brand voice, and statistical humility.",
    deliverables: [
      "Hypothesis and experiment design doc.",
      "Shipped variants plus instrumentation notes.",
      "Readout with decision on what to scale or kill.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Growth or marketing lead accountable for pipeline." },
      { role: "Operator sponsor", guide: "Sales IC grounding claims in real conversations." },
      { role: "AI practice sponsor", guide: "Truth-in-copy checks and experiment ethics." },
    ],
    officeHours: [
      "Day 5 — Hypothesis and metric critique.",
      "Day 8 — Copy and compliance review.",
      "Day 10 — Results storytelling rehearsal.",
    ],
    matchTerms: [
      "marketing",
      "growth",
      "sales",
      "experiment",
      "campaign",
      "landing",
      "startup",
      "business",
      "gtm",
      "positioning",
      "brand",
      "revenue",
    ],
  },
  {
    id: "learning-enablement",
    title: "Learning and enablement sprint",
    passionHint:
      "For people who teach, coach, or design clarity so others can perform without heroics.",
    surveyHooks: {
      q1: "Your day is workshops, guides, or leveling up colleagues.",
      q3: "Training, onboarding, instruction, or workforce development.",
      q5: "Progress is fewer repeat questions and faster time-to-productivity.",
    },
    businessProblem:
      "New hires or volunteers stall on the same handful of tasks; SMEs are overloaded answering repeats.",
    aiLeverage:
      "Use AI for outlines, quizzes, and drafts; SMEs validate accuracy—you trim scope and polish tone.",
    deliverables: [
      "Task analysis for the top friction points.",
      "Micro-lesson pack or job aids with review stamps from SMEs.",
      "Launch checklist for managers.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "L&D or enablement lead." },
      { role: "Operator sponsor", guide: "Subject-matter partner with veto on technical truth." },
      { role: "AI practice sponsor", guide: "Pedagogy + factual QA loops." },
    ],
    officeHours: [
      "Day 5 — Audience and outcome alignment.",
      "Day 8 — SME accuracy audit.",
      "Day 10 — Teach-back rehearsal.",
    ],
    matchTerms: [
      "training",
      "teach",
      "coach",
      "onboarding",
      "learning",
      "education",
      "instruction",
      "enablement",
      "workshop",
      "curriculum",
      "lms",
    ],
  },
  {
    id: "product-discovery",
    title: "Product discovery sprint",
    passionHint:
      "For people who thrive on user truth, tradeoffs, and aligning teams around evidence.",
    surveyHooks: {
      q1: "Your day is prototypes, user conversations, or roadmap debates.",
      q3: "Building products, discovery, or creative collaboration with builders.",
      q5: "Progress is a shared artifact engineers and design both trust.",
    },
    businessProblem:
      "The team debates features without a shared, lightweight evidence pack.",
    aiLeverage:
      "Use AI for interview summaries and competitive teardown drafts; you still run or join real user conversations.",
    deliverables: [
      "Problem statement and assumption map.",
      "Evidence digest with quotes and competitive notes.",
      "Recommended next experiment with success signals.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Product manager accountable for outcomes." },
      { role: "Operator sponsor", guide: "Design or research partner for methods." },
      { role: "AI practice sponsor", guide: "Bias, privacy, and synthesis quality bar." },
    ],
    officeHours: [
      "Day 5 — Problem framing critique.",
      "Day 8 — Evidence sufficiency review.",
      "Day 10 — Roadmap conversation prep.",
    ],
    matchTerms: [
      "product",
      "prototype",
      "ux",
      "user research",
      "discovery",
      "roadmap",
      "feature",
      "design",
      "pm",
      "iteration",
    ],
  },
  {
    id: "creative-content",
    title: "Creative and content systems sprint",
    passionHint:
      "For makers who need consistency at scale—campaigns, newsletters, or partner kits.",
    surveyHooks: {
      q1: "Your day is writing, visual rhythm, or cultural storytelling.",
      q3: "Creative work, content, copy, or multimedia.",
      q5: "Progress is a reusable system others can run.",
    },
    businessProblem:
      "Campaigns need volume and coherence across channels; reviewers bottleneck approvals.",
    aiLeverage:
      "Use AI with style guides for variants; editors own tone, facts, and regulatory sensitivities.",
    deliverables: [
      "Voice and guardrails sheet.",
      "Variant matrix with approved exemplars.",
      "Production checklist for the marketing ops owner.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Creative or content lead." },
      { role: "Operator sponsor", guide: "Editor or brand steward." },
      { role: "AI practice sponsor", guide: "Fact checks and disclosure norms." },
    ],
    officeHours: [
      "Day 5 — Voice and risk boundaries.",
      "Day 8 — Fact and claims audit.",
      "Day 10 — Packaging for reuse.",
    ],
    matchTerms: [
      "creative",
      "content",
      "writing",
      "copy",
      "story",
      "design",
      "campaign",
      "newsletter",
      "social",
      "brand",
      "video",
      "multimedia",
    ],
  },
  {
    id: "nonprofit-founder",
    title: "Small team storytelling and applications sprint",
    passionHint:
      "For people motivated by mission-heavy organizations that run lean and need leverage.",
    surveyHooks: {
      q1: "Your day advances a mission you would defend in public.",
      q3: "Nonprofits, community ventures, or founder-led teams.",
      q5: "Progress is clearer fundraising or program narrative with verified facts.",
    },
    businessProblem:
      "Grants and donor updates drift because facts live in scattered docs and founder heads.",
    aiLeverage:
      "Use AI to draft responses from verified stats; you validate names, numbers, and relationship nuances.",
    deliverables: [
      "Fact base with owners and refresh cadence.",
      "Updated boilerplate suite for grants or donors.",
      "Office-hours playbook for leadership reviews.",
    ],
    sponsors: [
      { role: "Domain sponsor", guide: "Executive director or founder." },
      { role: "Operator sponsor", guide: "Programs or finance partner for truth checks." },
      { role: "AI practice sponsor", guide: "Grant ethics and confidentiality norms." },
    ],
    officeHours: [
      "Day 5 — Narrative arc critique.",
      "Day 8 — Numbers reconciliation.",
      "Day 10 — Funder-facing rehearsal.",
    ],
    matchTerms: [
      "nonprofit",
      "mission",
      "grant",
      "donor",
      "foundation",
      "community org",
      "founder",
      "ngo",
      "social impact",
      "fundraising",
      "volunteer org",
    ],
  },
];

export type SprintRank = {
  sprint: MicroInternshipSprint;
  score: number;
};

export function rankSprintsForAnswers(answers: IntakeAnswers): SprintRank[] {
  const haystack = [answers.q1, answers.q2, answers.q3, answers.q5].join(" ").toLowerCase();

  const ranked = MICRO_INTERNSHIP_SPRINTS.map((sprint) => {
    let score = 0;
    for (const term of sprint.matchTerms) {
      if (haystack.includes(term)) {
        score += 1;
      }
    }
    return { sprint, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

import {
  AI_PROJECT_SPRINTS,
  AI_PROJECT_SPRINTS_INTRO,
  PROJECT_SPRINT_SLUGS,
  getProjectSprintBySlug,
  projectSprintPath,
  type ProjectSprintSlug,
} from "@/lib/ai-tracks-data";

export type RoadmapDayNode = {
  id: string;
  dayLabel: string;
  theme: string;
  tools: string[];
  deliverable: string;
};

export type SprintRoadmapData = {
  slug: ProjectSprintSlug;
  number: number;
  title: string;
  subtitle: string;
  promise: string;
  skinInTheGame: string;
  week1Label: string;
  week2Label: string;
  week1: RoadmapDayNode[];
  week2: RoadmapDayNode[];
  proofArtifacts: { name: string; target: string }[];
};

export const SPRINT_ROADMAPS_INTRO = {
  title: "Project Sprint Roadmaps",
  lead: AI_PROJECT_SPRINTS_INTRO.lead,
  throughline: AI_PROJECT_SPRINTS_INTRO.throughline,
  hint: "Each roadmap shows the phased path from zero to a shareable proof-of-work artifact across six weeks — the same sprints as the written guides, in roadmap.sh-style flow.",
} as const;

const SALES_ROADMAP: SprintRoadmapData = {
  slug: "sales",
  number: 1,
  title: "Sales",
  subtitle: "Go from zero to a verifiable sales outcome with the AI-native stack pros actually use",
  promise: "In 6 weeks, identify 50 real prospects, run personalized AI-powered outreach, and book at least 3 discovery calls — or produce documented proof of every rep you ran.",
  skinInTheGame: "Share results publicly on LinkedIn by week 6.",
  week1Label: "Weeks 1–3 — Learn the craft + build the machine",
  week2Label: "Weeks 4–6 — Execute, iterate, close",
  week1: [
    {
      id: "sales-d1",
      dayLabel: "Day 1",
      theme: "ICP + market map",
      tools: ["Claude", "Perplexity", "Clay"],
      deliverable: "1-page ICP doc: industry, company size, titles, pain points, buying triggers",
    },
    {
      id: "sales-d2",
      dayLabel: "Day 2",
      theme: "Prospect list build",
      tools: ["Clay", "Apollo.io", "LinkedIn Sales Nav", "Hunter.io"],
      deliverable: "HubSpot loaded with 50 enriched contacts (email, LinkedIn, trigger event)",
    },
    {
      id: "sales-d3",
      dayLabel: "Day 3",
      theme: "Cold email craft",
      tools: ["Claude", "Lavender AI", "Instantly.ai"],
      deliverable: "3 email sequences (5 steps each), all scored ≥90 in Lavender",
    },
    {
      id: "sales-d4",
      dayLabel: "Day 4",
      theme: "LinkedIn + cold call script",
      tools: ["Claude", "Otter.ai", "Reclaim.ai"],
      deliverable: "5-touch LinkedIn cadence + cold call script with objection tree",
    },
    {
      id: "sales-d5",
      dayLabel: "Day 5",
      theme: "Automate the stack",
      tools: ["Clay", "Make / Zapier", "HubSpot", "Notion AI"],
      deliverable: "Clay → HubSpot → Instantly flow: enrich, tag, enroll automatically",
    },
  ],
  week2: [
    {
      id: "sales-d6",
      dayLabel: "Day 6",
      theme: "Launch sequences",
      tools: ["Instantly.ai", "HubSpot", "Lavender AI"],
      deliverable: "25 emails live, 10 LinkedIn DMs sent, HubSpot activity populated",
    },
    {
      id: "sales-d7",
      dayLabel: "Day 7",
      theme: "Signal hunting",
      tools: ["Clay", "Perplexity", "Gong"],
      deliverable: "Top 10 warm prospects flagged; follow-up touches queued",
    },
    {
      id: "sales-d8",
      dayLabel: "Day 8",
      theme: "Cold call blitz",
      tools: ["Otter.ai", "Claude", "Google Voice"],
      deliverable: "20 calls logged + AI debrief; revised script v2",
    },
    {
      id: "sales-d9",
      dayLabel: "Day 9",
      theme: "Send remaining + iterate",
      tools: ["Instantly.ai", "Lavender AI", "HubSpot"],
      deliverable: "All 50 in-sequence; open rates tracked; winning subject line identified",
    },
    {
      id: "sales-d10",
      dayLabel: "Day 10",
      theme: "Discovery call prep",
      tools: ["Claude", "Reclaim.ai", "Calendly"],
      deliverable: "MEDDIC discovery template + prep sheet per booked meeting",
    },
    {
      id: "sales-d11",
      dayLabel: "Days 11–12",
      theme: "Run discovery calls",
      tools: ["Otter.ai", "Gong", "Notion AI"],
      deliverable: "Call recordings + summaries; follow-ups within 2 hours",
    },
    {
      id: "sales-d13",
      dayLabel: "Day 13",
      theme: "Pipeline audit + deal room",
      tools: ["Notion AI", "HubSpot", "Loom"],
      deliverable: "Notion deal room + 5-min Loom walkthrough of your process",
    },
    {
      id: "sales-d14",
      dayLabel: "Week 6",
      theme: "Ship proof of work",
      tools: ["Claude", "Loom", "LinkedIn"],
      deliverable: "LinkedIn post live — metrics, screenshots, learnings",
    },
  ],
  proofArtifacts: [
    { name: "Qualified prospects in CRM", target: "50 contacts" },
    { name: "Live outreach sequences", target: "3 sequences" },
    { name: "Discovery calls or send log", target: "≥3 calls or 150+ emails" },
    { name: "LinkedIn proof post", target: "1 post" },
    { name: "Notion/Loom deal room", target: "1 deal room" },
  ],
};

const MARKETING_ROADMAP: SprintRoadmapData = {
  slug: "marketing",
  number: 2,
  title: "Marketing",
  subtitle: "Go from zero to a live, measurable campaign with the AI-native stack marketers ship with",
  promise: "In 6 weeks, define a target audience, build a multi-channel campaign, publish it, and report real performance metrics. No decks without distribution.",
  skinInTheGame: "Publish a campaign retrospective on LinkedIn by week 6 with real numbers.",
  week1Label: "Weeks 1–3 — Strategy, positioning, and pipeline",
  week2Label: "Weeks 4–6 — Publish, distribute, and measure",
  week1: [
    {
      id: "mkt-d1",
      dayLabel: "Day 1",
      theme: "Audience + positioning",
      tools: ["Claude", "Perplexity", "Notion AI"],
      deliverable: "Strategy doc: ICP, 3 messaging pillars, tone, competitor differentiation",
    },
    {
      id: "mkt-d2",
      dayLabel: "Day 2",
      theme: "Content audit + competitive research",
      tools: ["Perplexity", "Claude", "SparkToro"],
      deliverable: "Swipe file of 10 reference pieces with hook/format/why notes",
    },
    {
      id: "mkt-d3",
      dayLabel: "Day 3",
      theme: "Content calendar + brief templates",
      tools: ["Claude", "Notion AI", "Buffer / Taplio"],
      deliverable: "14-day calendar + reusable Claude prompt templates per channel",
    },
    {
      id: "mkt-d4",
      dayLabel: "Day 4",
      theme: "Build the content pipeline",
      tools: ["Claude", "Jasper / Copy.ai", "Canva AI", "Make / Zapier"],
      deliverable: "Documented brief → draft → design → schedule pipeline; 3 pieces through it",
    },
    {
      id: "mkt-d5",
      dayLabel: "Day 5",
      theme: "Landing page or lead magnet",
      tools: ["Claude", "Framer AI", "Beehiiv / ConvertKit"],
      deliverable: "Live landing page with opt-in, tracking pixel, ≥1 real opt-in",
    },
  ],
  week2: [
    {
      id: "mkt-d6",
      dayLabel: "Day 6",
      theme: "Publish batch 1",
      tools: ["Buffer", "Taplio", "Notion AI"],
      deliverable: "5 pieces live; engagement log started in Notion",
    },
    {
      id: "mkt-d7",
      dayLabel: "Day 7",
      theme: "Amplification + community distribution",
      tools: ["Claude", "Perplexity", "Taplio"],
      deliverable: "5 distribution actions beyond owned channels",
    },
    {
      id: "mkt-d8",
      dayLabel: "Day 8",
      theme: "Email campaign launch",
      tools: ["Claude", "Beehiiv / ConvertKit", "Lavender AI"],
      deliverable: "3-email nurture sequence live with open-rate tracking",
    },
    {
      id: "mkt-d9",
      dayLabel: "Day 9",
      theme: "Publish batch 2 + iterate",
      tools: ["Buffer", "Claude", "Canva AI"],
      deliverable: "All 10 pieces published; top format identified and remixed",
    },
    {
      id: "mkt-d10",
      dayLabel: "Day 10",
      theme: "Short-form video or carousel",
      tools: ["Claude", "Descript", "Canva AI", "CapCut"],
      deliverable: "One high-effort video or carousel published for mobile",
    },
    {
      id: "mkt-d11",
      dayLabel: "Days 11–12",
      theme: "Analytics deep dive",
      tools: ["Claude", "Notion AI", "Google Analytics", "Buffer Analytics"],
      deliverable: "Metrics dashboard: reach, engagement, clicks, opt-ins, best/worst piece",
    },
    {
      id: "mkt-d13",
      dayLabel: "Day 13",
      theme: "Campaign retrospective",
      tools: ["Claude", "Notion AI"],
      deliverable: "1-page post-mortem: hypothesis, numbers, what you'd scale or cut",
    },
    {
      id: "mkt-d14",
      dayLabel: "Week 6",
      theme: "Ship proof of work",
      tools: ["Claude", "Loom", "LinkedIn"],
      deliverable: "LinkedIn post with campaign overview, metrics, links to best piece + landing page",
    },
  ],
  proofArtifacts: [
    { name: "Audience + positioning doc", target: "1 strategy doc" },
    { name: "Published content", target: "≥10 pieces" },
    { name: "Content pipeline", target: "1 repeatable workflow" },
    { name: "Landing page or lead magnet", target: "1 live URL" },
    { name: "Metrics dashboard", target: "1 dashboard" },
    { name: "LinkedIn retrospective", target: "1 post" },
  ],
};

const FDE_ROADMAP: SprintRoadmapData = {
  slug: "forward-deployed-engineer",
  number: 3,
  title: "Forward Deployed Engineer",
  subtitle: "Go from zero to a customer-facing technical asset with the AI-native stack FDEs use in the field",
  promise: "In 6 weeks, scope a real customer problem, build a working POC, and deliver a recorded walkthrough a customer could watch today and say \"I want that.\"",
  skinInTheGame: "Publish the GitHub repo + Loom demo publicly by week 6.",
  week1Label: "Weeks 1–3 — Understand the customer + design the solution",
  week2Label: "Weeks 4–6 — Build, test, and ship to customer",
  week1: [
    {
      id: "fde-d1",
      dayLabel: "Day 1",
      theme: "Customer archetype + use case map",
      tools: ["Claude", "Perplexity", "Notion AI"],
      deliverable: "Customer archetype doc: systems, integration pain, what \"solved\" looks like",
    },
    {
      id: "fde-d2",
      dayLabel: "Day 2",
      theme: "Discovery interview simulation",
      tools: ["Claude", "Otter.ai", "Notion AI"],
      deliverable: "Simulated discovery transcript + structured problem statement",
    },
    {
      id: "fde-d3",
      dayLabel: "Day 3",
      theme: "Architecture sketch + stack decision",
      tools: ["Claude", "Cursor", "Excalidraw"],
      deliverable: "Architecture diagram + ADR: scope, non-goals, tradeoffs",
    },
    {
      id: "fde-d4",
      dayLabel: "Day 4",
      theme: "Environment setup + scaffolding",
      tools: ["Cursor", "GitHub Copilot", "Claude"],
      deliverable: "Public GitHub repo with README, deps, one working API call or data flow",
    },
    {
      id: "fde-d5",
      dayLabel: "Day 5",
      theme: "Core build sprint I",
      tools: ["Cursor", "Claude", "Postman", "ngrok"],
      deliverable: "Core integration working end-to-end with real data (not mocked)",
    },
  ],
  week2: [
    {
      id: "fde-d6",
      dayLabel: "Day 6",
      theme: "Core build sprint II",
      tools: ["Cursor", "Claude", "Vercel / Railway"],
      deliverable: "Feature-complete POC on a shareable URL",
    },
    {
      id: "fde-d7",
      dayLabel: "Day 7",
      theme: "Adversarial testing",
      tools: ["Claude", "Cursor", "Sentry"],
      deliverable: "Bug log; top 3 fixed; known limits in README",
    },
    {
      id: "fde-d8",
      dayLabel: "Day 8",
      theme: "Customer walkthrough dry run",
      tools: ["Claude", "Loom", "Otter.ai"],
      deliverable: "Dry run recording; 5 improvements, ≥2 implemented same day",
    },
    {
      id: "fde-d9",
      dayLabel: "Day 9",
      theme: "Polish + documentation",
      tools: ["Claude", "Notion AI", "GitHub Copilot"],
      deliverable: "README, setup guide, architecture notes, demo script",
    },
    {
      id: "fde-d10",
      dayLabel: "Day 10",
      theme: "Record the technical demo",
      tools: ["Loom", "Claude", "Descript"],
      deliverable: "Final Loom ≤10 min: problem, architecture, live demo, wow moment",
    },
    {
      id: "fde-d11",
      dayLabel: "Days 11–12",
      theme: "Post-mortem + ADR v2",
      tools: ["Claude", "Notion AI"],
      deliverable: "Post-mortem + updated ADR with real-world findings",
    },
    {
      id: "fde-d13",
      dayLabel: "Day 13",
      theme: "Write your public post",
      tools: ["Claude", "Notion AI"],
      deliverable: "LinkedIn/blog draft: problem → build → outcome → lesson",
    },
    {
      id: "fde-d14",
      dayLabel: "Week 6",
      theme: "Ship everything",
      tools: ["GitHub", "Loom", "LinkedIn"],
      deliverable: "Public repo + Loom demo + LinkedIn post — all live",
    },
  ],
  proofArtifacts: [
    { name: "PRD-lite + problem statement", target: "1 doc" },
    { name: "Live POC + GitHub repo", target: "1 build" },
    { name: "Technical demo (Loom)", target: "≤10 min" },
    { name: "Post-mortem + ADR v2", target: "1 doc" },
    { name: "Public LinkedIn post", target: "1 post" },
  ],
};

export const SPRINT_ROADMAPS: SprintRoadmapData[] = [SALES_ROADMAP, MARKETING_ROADMAP, FDE_ROADMAP];

export function sprintRoadmapPath(slug: ProjectSprintSlug): string {
  return `/sprint-roadmaps/${slug}`;
}

export function getSprintRoadmapBySlug(slug: string): SprintRoadmapData | undefined {
  return SPRINT_ROADMAPS.find((r) => r.slug === slug);
}

export function getSprintTrackForRoadmap(slug: ProjectSprintSlug) {
  return getProjectSprintBySlug(slug);
}

export { PROJECT_SPRINT_SLUGS, projectSprintPath };

/**
 * Content derived from "6 AI Sprints - Two Week Solo Builds.md" in the repo root.
 * Presented in-product as AI tracks: two-week builds with artifact + proof doc.
 */

export type TrackTableRow = { name: string; description: string };

export type AiTrack = {
  id: string;
  /** URL segment under `/project-sprints/` when this is a project sprint track. */
  slug?: string;
  number: number;
  title: string;
  subtitle: string;
  bet: string;
  /** Second paragraph under the bet—concrete work for project sprints. */
  whatYouDo?: string;
  week1: string;
  week2: string;
  deliverables: TrackTableRow[];
  tools: TrackTableRow[];
  outcomes: string;
};

export type AiTracksGuideIntro = {
  lead: string;
  throughline: string;
  structureIntro: string;
  structureRows: ReadonlyArray<TrackTableRow>;
  footnote: string;
};

export type AiTracksGuidePattern = {
  title: string;
  rows: ReadonlyArray<{ sector: string; build: string; proof: string }>;
  closing: string;
};

export const AI_TRACKS_GUIDE_TITLE = "6 Two-Week AI Tracks";
export const AI_SPRINTS_GUIDE_TITLE = "3 Two-Week Project Sprints";

export const PROJECT_SPRINT_SLUGS = [
  "sales",
  "marketing",
  "forward-deployed-engineer",
] as const;

export type ProjectSprintSlug = (typeof PROJECT_SPRINT_SLUGS)[number];

export function projectSprintPath(slug: ProjectSprintSlug): string {
  return `/project-sprints/${slug}`;
}

export function getProjectSprintBySlug(slug: string): AiTrack | undefined {
  return AI_PROJECT_SPRINTS.find((track) => track.slug === slug || track.id === slug);
}

export function projectSprintPathForRoleId(roleId: string): string {
  switch (roleId) {
    case "sales":
      return projectSprintPath("sales");
    case "marketing":
      return projectSprintPath("marketing");
    case "fde":
      return projectSprintPath("forward-deployed-engineer");
    case "swe":
      return "/project-sprints";
    default:
      return "/project-sprints";
  }
}

export const AI_PROJECT_SPRINTS_INTRO = {
  lead: `Three two-week sprints—pick the one that matches your target role.`,
  throughline: `Each sprint ends with something real you can share: a link, a deck, or a pipeline log.`,
  structureIntro: `How each sprint is structured:`,
  structureRows: [
    { name: "The bet", description: "One-sentence framing of the workflow being transformed" },
    { name: "Deliverables", description: "The artifacts that exist at the end" },
    { name: "Tool stack", description: "What you'll have used in anger, not just clicked through" },
    { name: "Outcomes", description: "The proof-of-work claim you can make on a resume or in an interview" },
  ],
  footnote: `A "sprint" here means a focused two-week build, not a Scrum ceremony. Nights and weekends count.`,
} as const;

export const AI_PROJECT_SPRINTS_PATTERN = {
  title: "The pattern across all three roles",
  rows: [
    {
      sector: "Sales",
      build: "50-prospect CRM, 3 outreach sequences, discovery calls booked",
      proof: "LinkedIn metrics post + Notion/Loom deal room",
    },
    {
      sector: "Marketing",
      build: "Live multi-channel campaign with landing page and content pipeline",
      proof: "Metrics dashboard + public campaign retrospective",
    },
    {
      sector: "Forward Deployed Engineer",
      build: "Customer-scoped POC on a live URL with architecture docs",
      proof: "Public GitHub repo + ≤10 min technical Loom demo",
    },
  ],
  closing: `Every sprint ends with two artifacts: the thing itself (running, viewable, ideally public) and the document that proves you understood what you built. That's the shape of evidence top roles look for—scaled to a portfolio piece a new grad can credibly produce in two weeks.`,
} as const;

export const AI_PROJECT_SPRINTS: AiTrack[] = [
  {
    id: "sales",
    slug: "sales",
    number: 1,
    title: "Sales",
    subtitle: "Go from zero to a verifiable sales outcome with the AI-native stack pros actually use",
    bet: `In 14 days you will find 50 real prospects, run personalized AI-powered outreach, and book at least 3 discovery calls—or show documented proof of every rep you ran. No fake data. No hypotheticals.`,
    whatYouDo: `Week 1: pick a vertical and write your ICP, load 50 enriched contacts into HubSpot, build cold email + LinkedIn + call scripts (scored in Lavender), and automate Clay → HubSpot → Instantly. Week 2: launch sequences, run 20+ cold calls, book meetings, build a Notion deal room with a Loom walkthrough, and post your metrics on LinkedIn.`,
    week1: "",
    week2: "",
    deliverables: [
      {
        name: "50 qualified prospects in CRM",
        description: "ICP-matched contacts with verified email, LinkedIn URL, and trigger event",
      },
      {
        name: "3 live outreach sequences",
        description: "Cold email (5 steps × 3 variants), LinkedIn cadence, and cold call script with objection tree",
      },
      {
        name: "Discovery calls or send log",
        description: "≥3 discovery calls booked, or 150+ emails sent with open/reply rates tracked in HubSpot",
      },
      {
        name: "Notion deal room + Loom",
        description: "Pipeline view, process doc, and 5-minute walkthrough of your full motion",
      },
      {
        name: "Public LinkedIn post",
        description: "Day 14 post with screenshots, metrics, and what you'd do differently",
      },
    ],
    tools: [
      { name: "Claude", description: "ICP research, email copy, objection handling, call debrief" },
      { name: "Perplexity", description: "Market research and real-time signal discovery" },
      { name: "Clay", description: "AI enrichment, waterfall data, personalization at scale" },
      { name: "Lavender AI", description: "Email coaching, reply prediction, A/B scoring (target ≥90)" },
      { name: "Notion AI", description: "Deal room, process docs, sprint retrospective" },
    ],
    outcomes: `By Day 14: publish your LinkedIn post with real open/reply rates, link your Notion deal room and Loom, and be ready to walk an interviewer through your ICP, top sequence, and either 3 booked calls or your full HubSpot activity log.`,
  },
  {
    id: "marketing",
    slug: "marketing",
    number: 2,
    title: "Marketing",
    subtitle: "Go from zero to a live, measurable campaign with the AI-native stack marketers ship with",
    bet: `In 14 days you will define a target audience, build a multi-channel campaign, publish it, and report real performance metrics. No decks without distribution. No content that never ships.`,
    whatYouDo: `Week 1: audience + positioning doc, competitive swipe file, 14-day content calendar with Claude prompt templates, documented brief → draft → publish pipeline, and a live landing page or lead magnet. Week 2: publish 10+ pieces, distribute beyond your own channels, launch a 3-email nurture sequence, build a metrics dashboard, and post your campaign retrospective on LinkedIn.`,
    week1: "",
    week2: "",
    deliverables: [
      {
        name: "Audience + positioning doc",
        description: "ICP, 3 messaging pillars, tone of voice, and how you differ from 2–3 competitors",
      },
      {
        name: "≥10 published content pieces",
        description: "Posts, email, and short-form video or carousel—through a repeatable AI-assisted pipeline",
      },
      {
        name: "Live landing page or lead magnet",
        description: "Published URL with opt-in, tracking pixel, and at least one real opt-in",
      },
      {
        name: "Campaign metrics dashboard",
        description: "Reach, engagement, clicks, email opens, opt-ins—plus best/worst piece and why",
      },
      {
        name: "Public LinkedIn retrospective",
        description: "What shipped, real numbers, top lessons, links to your best piece and landing page",
      },
    ],
    tools: [
      { name: "Claude", description: "Strategy, content drafts, email copy, retrospective writing" },
      { name: "Perplexity", description: "Audience research, competitor content, trend discovery" },
      { name: "Notion AI", description: "Content calendar, swipe file, briefs, metrics dashboard" },
      { name: "Canva AI", description: "Social graphics, carousels, landing page visuals" },
      { name: "Framer AI", description: "AI-generated landing pages—live in under an hour" },
    ],
    outcomes: `By Day 14: link your live landing page and best-performing post, screenshot your metrics dashboard, publish the LinkedIn retrospective with real impressions/clicks/opt-ins, and explain one winner and one flop in an interview.`,
  },
  {
    id: "forward-deployed-engineer",
    slug: "forward-deployed-engineer",
    number: 3,
    title: "Forward Deployed Engineer",
    subtitle: "Go from zero to a customer-facing technical asset with the AI-native stack FDEs use in the field",
    bet: `In 14 days you will scope a real customer problem, build a working proof-of-concept, and deliver a recorded walkthrough a customer could watch today and say "I want that." No toy examples. No slides without code.`,
    whatYouDo: `Week 1: customer archetype doc, simulated technical discovery, architecture diagram + ADR, GitHub scaffold, and core integration with real data flowing through. Week 2: deploy a shareable POC, adversarial test and fix top bugs, record a ≤10 min Loom demo, write post-mortem + ADR v2, and publish repo + LinkedIn by Day 14.`,
    week1: "",
    week2: "",
    deliverables: [
      {
        name: "PRD-lite + problem statement",
        description: "Customer archetype, current vs. desired state, constraints, and success criteria",
      },
      {
        name: "Live POC + public GitHub repo",
        description: "Integration, demo env, or automation on a shareable URL—documented and deployable",
      },
      {
        name: "Technical demo (Loom ≤10 min)",
        description: "Problem framing, architecture overview, live walkthrough, one wow moment",
      },
      {
        name: "Post-mortem + ADR v2",
        description: "What broke, architecture tradeoffs, and what you'd rebuild differently",
      },
      {
        name: "Public LinkedIn post",
        description: "What you built, why it matters, links to repo and Loom",
      },
    ],
    tools: [
      { name: "Claude", description: "Architecture design, code review, doc writing, post-mortem" },
      { name: "Cursor", description: "Primary IDE—autocomplete, inline edits, chat-driven coding" },
      { name: "GitHub Copilot", description: "In-editor completions, test generation, scaffolding" },
      { name: "Perplexity", description: "Market context, API docs, tech landscape" },
      { name: "Notion AI", description: "PRD-lite, ADR, post-mortem, demo script" },
    ],
    outcomes: `By Day 14: push final code to a public GitHub repo, publish your Loom demo and LinkedIn post, and practice the narrative arc—problem → friction → solution → wow moment → what's next—in a mock customer or interview setting.`,
  },
];

export const AI_TRACKS_GUIDE_INTRO = {
  lead: `One track per AI-first role. Each is designed to produce the kind of evidence serious AI-forward roles screen for: not "I used Claude," but "here is a working thing I built that changed how real work gets done." Ship the artifact, write the runbook, leave the playbook behind.`,
  throughline: `The throughline across all six: build alongside the work, not above it. By the end of two weeks you should be able to point a recruiter (or yourself, six months from now) at a public repo or a shareable doc and say, "this is what I changed."`,
  structureIntro: `How each track is structured:`,
  structureRows: [
    { name: "The bet", description: "One-sentence framing of the workflow being transformed" },
    { name: "Week 1 / Week 2", description: "Narrative arc of the build — what gets made, in what order" },
    { name: "Deliverables", description: "The artifacts that exist at the end" },
    { name: "Tool stack", description: "What you'll have used in anger, not just clicked through" },
    { name: "Outcomes", description: "The proof-of-work claim you can make on a resume or in an interview" },
  ],
  footnote: `A "track" here means a focused two-week build, not a Scrum ceremony. Nights and weekends count.`,
} as const;

export const AI_TRACKS: AiTrack[] = [
  {
    id: "financial-analyst",
    number: 1,
    title: "AI Financial Analyst",
    subtitle: "Make the comps table run itself",
    bet: `A first-year banking analyst spends 8–12 hours a quarter rebuilding the same comp table from 10-Qs and transcripts. You'll compress that to a 30-minute review.`,
    week1: `Pick a coverage universe — say, eight US fintech / payments names. Wire up SEC EDGAR (free) to pull 10-Ks and 10-Qs on a cron. Chunk filings and embed them. Build a Claude-powered extractor that pulls revenue, EBITDA, segment mix, and forward guidance into a structured row per filing. Land the output in a Google Sheet or .xlsx that updates itself.`,
    week2: `Layer in a transcript-watcher: when a new earnings call drops, the agent reads it, diffs tone and guidance vs. the prior quarter, and posts a one-paragraph note to your Slack or email. Add a memo-generator that turns the comp table into a first-draft sector update. Write the runbook so a peer can rerun the whole thing next quarter without calling you.`,
    deliverables: [
      { name: "Live comp-table notebook", description: "Pulls fresh filings, fills the table, with citations back to the source PDF" },
      { name: "Transcript-diff agent", description: "Slack/email alert flagging tone, guidance, and segment changes" },
      { name: "Memo generator", description: "First-draft sector update from the comp table" },
      { name: "Runbook", description: "Markdown doc — anyone on the team can run this next cycle" },
    ],
    tools: [
      { name: "Claude / Claude Code", description: "Extraction prompts, agent loops, eval-style spot checks" },
      { name: "SEC EDGAR API", description: "Programmatic 10-K / 10-Q pulls" },
      { name: "yfinance + openpyxl", description: "Market data into Excel-native outputs" },
      { name: "Streamlit", description: "Lightweight dashboard for the analyst to QA" },
      { name: "Slack webhook", description: "Alert routing for new filings" },
    ],
    outcomes: `Built an LLM pipeline that turns quarterly filings into a maintained comp set and a first-draft memo. Replaced ~10 hours of manual scrubbing per quarter with a 30-minute QA pass.`,
  },
  {
    id: "strategy-consultant",
    number: 2,
    title: "AI Strategy Consultant",
    subtitle: "Build the recommendation, don't just describe it",
    bet: `A first-year consultant's deck ends with "automate this workflow." You'll arrive with the automation already running.`,
    week1: `Pick a real, public-data problem with a defensible recommendation — e.g., "how should a mid-market F&B chain in Singapore price its loyalty program in 2026?" or "where should a regional logistics player focus last-mile growth?" Do the work: AI-assisted competitive scan, market sizing, two or three signal sources triangulated. Land it as a one-page synthesis.`,
    week2: `Pick the most concrete recommendation and build the thing. A pricing-sensitivity simulator. A customer-segmentation notebook with a real CSV. A Make/Zapier flow that automates whatever workflow you'd otherwise put on slide 14. Then make the deck — 8 slides, executive style — and write a leave-behind playbook so the imagined client could rerun the analysis themselves. Bonus: hand the playbook to a non-technical friend and time how long it takes them.`,
    deliverables: [
      { name: "Eight-slide engagement deck", description: "Looks like a consulting output, not a portfolio piece" },
      { name: "Working prototype", description: "The thing you recommended, actually running" },
      { name: "Leave-behind playbook", description: "Step-by-step a non-technical person can follow" },
      { name: "Friend test notes", description: "What broke when someone else tried to use it" },
    ],
    tools: [
      { name: "Claude + Perplexity", description: "Research sweeps, primary source triangulation" },
      { name: "Gamma or Tome", description: "Deck production in hours not days" },
      { name: "Python / Streamlit", description: "Pricing or segmentation prototype" },
      { name: "Make or Zapier", description: "No-code workflow automation as the deliverable" },
    ],
    outcomes: `Took a real strategy question end-to-end: research, recommendation, working prototype, and a playbook a non-technical user can rerun. The proof-of-concept is the deliverable, not the slides.`,
  },
  {
    id: "product-analyst",
    number: 3,
    title: "AI Product Analyst",
    subtitle: "Ship one AI feature with the evals to prove it works",
    bet: `Most APMs talk about evals. You'll be the one who actually wrote some and can show before/after numbers.`,
    week1: `Pick a small product surface that has a clear right answer — classifying support tickets, generating commit messages, summarizing PR descriptions, drafting standup notes from a Slack channel. Build the feature against the Claude API. Hand-label 50–100 evaluation examples before you start iterating on prompts, and hold them out.`,
    week2: `Wire up a logging layer that captures every input, output, and (where possible) user reaction. Run your eval set against two or three prompt variants and produce a results table. Push the project public on GitHub with a README that explains the eval methodology. Write a short post on what changed between v1 and v2 of the prompt and why.`,
    deliverables: [
      { name: "Shipped AI feature", description: "Live somewhere on the internet (Vercel, Replit, etc.)" },
      { name: "Eval set (50–100 examples)", description: "Labeled, held out from prompt iteration" },
      { name: "Results table", description: "Quality scores across prompt versions" },
      { name: "Public writeup", description: "What I learned shipping my first eval-driven AI feature" },
    ],
    tools: [
      { name: "Claude API", description: "Production feature wiring, not playground prompts" },
      { name: "Promptfoo or Braintrust", description: "Eval harness with version-tracked runs" },
      { name: "Vercel / Replit", description: "Actually deployed, not localhost" },
      { name: "GitHub + simple SQLite", description: "Logging layer for user interactions" },
    ],
    outcomes: `Shipped a small AI feature end-to-end and ran an eval-driven prompt refactor that improved quality on a labeled holdout. I can talk model behavior in numbers, not vibes.`,
  },
  {
    id: "research-associate",
    number: 4,
    title: "AI Research Associate",
    subtitle: "Build the RAG you wish you had as an undergrad",
    bet: `A grad student spends two weeks on a literature review. You'll do a better one in two days — and the tool you built to do it is the artifact.`,
    week1: `Pick a topic with a real, bounded corpus. "GLP-1 receptor agonists and cardiovascular outcomes, 2018–2025" and "field experiments in development economics, sub-Saharan Africa, 2015–2024" are both good shapes — 150 to 300 papers, well-indexed in Semantic Scholar or PubMed. Pull the corpus via API, chunk and embed, build a Claude-powered retrieval interface that answers questions with paper-level citations.`,
    week2: `Use your own tool to produce a real synthesized literature review — 2,000 words, properly cited. Then audit it: take three LLM-generated summary paragraphs and hand-check them against the underlying papers for hallucination, missing nuance, and citation accuracy. Publish the methodology alongside the lit review so a PI could trust (or critique) the process.`,
    deliverables: [
      { name: "Domain RAG interface", description: "Working retrieval over 150–300 papers, with citations" },
      { name: "Synthesized lit review", description: "2,000 words, the kind a research group would actually share" },
      { name: "Hallucination audit", description: "Hand-checked accuracy table for three sample paragraphs" },
      { name: "Methodology note", description: "How a PI could verify or extend the system" },
    ],
    tools: [
      { name: "Claude", description: "Synthesis with cited retrieval, not free-form generation" },
      { name: "Semantic Scholar / PubMed APIs", description: "Corpus assembly programmatically" },
      { name: "LlamaIndex + Chroma", description: "Chunking, embedding, retrieval" },
      { name: "Zotero", description: "Reference management against the audit set" },
    ],
    outcomes: `Built a domain-specific RAG over 250 papers, used it to produce a synthesized literature review, and audited the output against primary sources for hallucination. A research group could pick this up and use it tomorrow.`,
  },
  {
    id: "policy-analyst",
    number: 5,
    title: "AI Policy Analyst",
    subtitle: "Make regulation legible faster than anyone",
    bet: `Policy shops still read the Federal Register by hand. You'll have a tool that does the first pass and a memo that proves you can do the second.`,
    week1: `Pick one regulatory beat — US state AI laws in 2026, EU AI Act enforcement actions, FTC algorithmic-discrimination cases, NIST AI RMF updates. Build a daily scraper against the Federal Register API, Congress.gov, or the relevant agency RSS. Run incoming text through Claude to summarize, tag by risk area, and flag whether the new item changes the legal landscape. Output: a daily digest that lands in your inbox.`,
    week2: `Use the tracker's output to write a four-page policy memo on the state of your beat — what's changed in the last 60 days, what's likely to change, who it affects. Add a simple scenario simulator: "if Rule X passes, here is the compliance cost range for a 500-person SaaS company." Send the memo to five real people in the field and ask what's missing. Iterate once.`,
    deliverables: [
      { name: "Running regulatory tracker", description: "Daily digest, tagged by risk area" },
      { name: "Four-page policy memo", description: "State-of-the-beat, written from the tracker's output" },
      { name: "Scenario simulator", description: "Compliance cost ranges under different rule outcomes" },
      { name: "Reader feedback notes", description: "Five people, their critiques, what you changed" },
    ],
    tools: [
      { name: "Claude", description: "Summarization, tagging, scenario reasoning" },
      { name: "Federal Register / Congress.gov APIs", description: "Programmatic monitoring" },
      { name: "Python + cron", description: "Daily run, no manual triggering" },
      { name: "Substack or simple email", description: "Distribution to real readers" },
    ],
    outcomes: `Built a regulatory monitoring system over [my beat], used it to produce a memo that five practitioners in the field read and gave notes on. I know this policy area cold and I have the tooling to prove I'm not going to forget it.`,
  },
  {
    id: "clinical-analyst",
    number: 6,
    title: "AI Clinical / Life Sciences Analyst",
    subtitle: "Pull signal out of unstructured medical text",
    bet: `Clinical research lives or dies on whether you can structure messy free text. You'll build a small extraction pipeline and — more importantly — show you know how to audit it.`,
    week1: `Pick a public dataset: MIMIC-IV (de-identified ICU notes, requires credentialed access but is free), OpenFDA's FAERS database (adverse event reports), or ClinicalTrials.gov protocols. Build an NLP pipeline using Claude that extracts a structured schema — diagnoses, drugs, doses, adverse events — from the free text. Validate codes against ICD-10 and RxNorm.`,
    week2: `This is where the role earns its keep: audit the pipeline. Hand-label a 100-record validation subset. Compute precision, recall, F1 on each extracted field. Then go looking for bias — are certain demographic groups under-extracted? Are rare adverse events systematically missed? Write a three-page methods note that a regulatory reviewer or PI would find credible.`,
    deliverables: [
      { name: "Extraction pipeline", description: "Free text → structured schema, code-validated" },
      { name: "Labeled validation set", description: "100 records, hand-checked" },
      { name: "Metrics table", description: "Precision, recall, F1 per field" },
      { name: "Bias / accuracy audit memo", description: "Three pages, written for a clinical reviewer" },
    ],
    tools: [
      { name: "Claude", description: "Structured extraction prompts, schema enforcement" },
      { name: "OpenFDA / MIMIC-IV / ClinicalTrials.gov", description: "Real public clinical corpora" },
      { name: "spaCy + scispaCy / MedSpaCy", description: "Clinical NLP baselines to compare against" },
      { name: "RxNorm / UMLS APIs", description: "Code normalization for validation" },
    ],
    outcomes: `Built and audited an NLP extraction pipeline on a real public clinical dataset. I can talk precision and recall on a held-out set, and I've written a methods note that takes bias seriously — not just throughput.`,
  },
];

export const AI_TRACKS_PATTERN = {
  title: "The pattern across all six",
  rows: [
    { sector: "Finance", build: "Comps + memo agent", proof: "Quarter-over-quarter time savings, runbook" },
    { sector: "Consulting", build: "Working prototype of the recommendation", proof: "Friend can run the playbook without you" },
    { sector: "Tech / Product", build: "One shipped AI feature", proof: "Eval set with before/after numbers" },
    { sector: "Research", build: "Domain RAG", proof: "Lit review + hallucination audit" },
    { sector: "Policy", build: "Regulatory tracker", proof: "Memo + feedback from five real readers" },
    { sector: "Clinical", build: "Extraction pipeline", proof: "Validation metrics + bias audit" },
  ],
  closing: `Every track ends with two artifacts: the thing itself (running, viewable, ideally public) and the document that proves you understood what you built (runbook, audit, writeup, methods note). That's the shape of evidence top AI-forward roles look for, scaled to a portfolio piece a new grad can credibly produce in two weeks.`,
} as const;

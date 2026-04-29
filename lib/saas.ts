export type ServiceChoice = {
  category: string;
  recommendation: string;
  accountNeeded: string;
  why: string;
};

export const mvpServiceChoices: ServiceChoice[] = [
  {
    category: "Hosting",
    recommendation: "Vercel",
    accountNeeded: "Vercel account connected to GitHub",
    why: "Fastest path for a Next.js SaaS MVP with preview deploys and environment variables.",
  },
  {
    category: "Database",
    recommendation: "Supabase Postgres or Neon",
    accountNeeded: "Supabase or Neon account",
    why: "Production persistence for users, intake sessions, generated search requests, and future search results.",
  },
  {
    category: "Auth",
    recommendation: "Clerk or Supabase Auth",
    accountNeeded: "Clerk account, or reuse Supabase",
    why: "Adds sign-in, account management, and user-scoped saved intakes without building auth from scratch.",
  },
  {
    category: "LLM",
    recommendation: "OpenAI or Anthropic",
    accountNeeded: "API account and key",
    why: "Can improve inference quality once the deterministic MVP flow is validated.",
  },
  {
    category: "Email",
    recommendation: "Resend",
    accountNeeded: "Resend account and verified domain",
    why: "Useful for waitlist capture, search completion alerts, and onboarding emails.",
  },
  {
    category: "Payments",
    recommendation: "Stripe",
    accountNeeded: "Stripe account",
    why: "Needed when packaging saved searches, usage limits, or premium automation as paid plans.",
  },
];

export const searchRunnerOptions = [
  {
    name: "Manual handoff",
    stage: "MVP",
    tradeoff:
      "Lowest risk: generate editable search requests and let users copy them into a job board or browser agent.",
  },
  {
    name: "Job-search API",
    stage: "Beta",
    tradeoff:
      "More reliable than scraping, but provider coverage and result quality vary by vendor.",
  },
  {
    name: "Managed browser automation",
    stage: "Later",
    tradeoff:
      "Can mimic the OpenClaw flow, but requires queueing, retries, session handling, and provider terms review.",
  },
];

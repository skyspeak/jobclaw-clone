/**
 * Internship-style matches produced by the JobClaw matching agent pipeline.
 * Replace or hydrate this list from your agent API or job-ingestion worker when available.
 */
export type AgentInternshipListing = {
  id: string;
  title: string;
  organization: string;
  format: "Remote" | "Hybrid" | "On-site" | "Flexible";
  location: string;
  summary: string;
  durationWeeks: string;
  tags: string[];
};

export const AGENT_INTERNSHIP_LISTINGS: AgentInternshipListing[] = [
  {
    id: "civic-data-fellow",
    title: "Civic data fellow",
    organization: "Metro Civic Lab (host nonprofit)",
    format: "Hybrid",
    location: "East Bay, CA",
    summary:
      "Help leadership interpret neighborhood program outcomes: light analysis, clean charts, and a short playback for community partners. AI assists drafts; you own verification.",
    durationWeeks: "10–12",
    tags: ["Data", "Community", "Storytelling"],
  },
  {
    id: "enablement-intern",
    title: "Learning & enablement intern",
    organization: "Regional Workforce Alliance",
    format: "Remote",
    location: "US — remote",
    summary:
      "Support onboarding flows for apprenticeship cohorts: job aids, micro-lessons, and office hours for recurring questions. Strong fit if you like teaching clarity over heroics.",
    durationWeeks: "8",
    tags: ["Training", "Onboarding", "Nonprofit"],
  },
  {
    id: "ops-analyst-intern",
    title: "Operations analyst intern",
    organization: "GreenPath Operations Collective",
    format: "Hybrid",
    location: "Oakland, CA",
    summary:
      "Triage reporting bottlenecks across intake and volunteer scheduling; prototype small automations with oversight from ops and AI practice sponsors.",
    durationWeeks: "12",
    tags: ["Operations", "Systems", "Reporting"],
  },
  {
    id: "program-coordinator-youth",
    title: "Youth program coordinator (contract-to-hire)",
    organization: "Summit Youth Network",
    format: "On-site",
    location: "San Francisco, CA",
    summary:
      "Coordinate logistics and partner comms for after-school STEM clubs. Emphasis on calm follow-through, stakeholder notes, and inclusive facilitation.",
    durationWeeks: "12–16",
    tags: ["Programs", "Youth", "Coordination"],
  },
  {
    id: "research-assistant-policy",
    title: "Research assistant — climate programs",
    organization: "Open Policy Collaboratory",
    format: "Flexible",
    location: "Bay Area / partial remote",
    summary:
      "Synthesize public comment threads and grant requirements into decision memos. Citations and conflict checks are non-negotiable; AI for outlines only.",
    durationWeeks: "10",
    tags: ["Research", "Policy", "Writing"],
  },
  {
    id: "customer-success-associate",
    title: "Customer success associate (mission-driven SaaS)",
    organization: "Northstar EdTech (B-Corp)",
    format: "Remote",
    location: "US — remote",
    summary:
      "Serve small districts adopting classroom tools: triage asks, document playbooks, and pair with product on humane defaults. Great if you like helping people directly.",
    durationWeeks: "14",
    tags: ["Customer success", "Education", "Tools"],
  },
];

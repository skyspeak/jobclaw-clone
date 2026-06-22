import type { V2Analysis, V2Inputs } from "@/lib/v2/v2-types";

export const V2_SAMPLE_INPUTS: V2Inputs = {
  jobUrl: "https://jobs.lever.co/lumen/associate-brand-marketing-manager-austin",
  linkedInUrl: "https://www.linkedin.com/in/jordanrivera",
};

export const V2_SAMPLE_ANALYSIS: V2Analysis = {
  job: {
    title: "Associate Brand Marketing Manager",
    company: "Lumen",
    location: "Austin, TX (hybrid)",
    appliedDate: "applied Jun 2, 2026",
    initials: "JD",
    sourceLabel: "Read from job post",
  },
  candidate: {
    name: "Jordan Rivera",
    summary: "B.A. Communications, 2025 · Marketing intern + campus brand ambassador",
    initials: "JR",
    sourceLabel: "Read from LinkedIn",
  },
  strengths: [
    { label: "Brand storytelling & copy", score: 85, tier: "Strong" },
    { label: "Social & content production", score: 75, tier: "Strong" },
    { label: "Cross-team collaboration", score: 65, tier: "Solid" },
  ],
  gaps: [
    { label: "Marketing analytics (GA4, SQL basics, attribution)", score: 25, tier: "Gap" },
    { label: "AI content workflows (briefing, editing, QA of AI drafts)", score: 20, tier: "Gap" },
    { label: "Quantified results in a portfolio (campaign → metric)", score: 35, tier: "Gap" },
  ],
  journey: [
    {
      id: "analytics",
      weeksLabel: "WEEKS 1 TO 2 · ANALYTICS",
      title: "Speak the language of results",
      bullets: [
        "Google Analytics 4 certification (free, ~6 hrs)",
        "SQL for marketers: 4 short lessons, pull your own campaign numbers",
        'Rewrite one resume bullet as "action → metric"',
      ],
    },
    {
      id: "ai",
      weeksLabel: "WEEKS 2 TO 4 · AI FLUENCY",
      title: "Run AI like a manager, not a tourist",
      bullets: [
        "Build a content workflow: brief, generate, edit, fact check, ship",
        "Hands on with an AI agent to draft and schedule a 5 post campaign",
        "On-ramp to agent skills, framed as non-negotiable for entry level now",
      ],
    },
    {
      id: "proof",
      weeksLabel: "WEEKS 3 TO 6 · PROOF",
      title: "A real project with a real number",
      bullets: [
        "Service opportunity: run a campaign for a local nonprofit (via VolunteerMatch)",
        "Report the result: reach, signups, or dollars raised",
        "Turn it into one portfolio case study and one LinkedIn post",
      ],
    },
    {
      id: "reapply",
      weeksLabel: "WEEK 6 · RE-APPLY",
      title: "Go back stronger",
      bullets: [
        "dear [CC] resurfaces 8 to 12 roles where you now have an edge",
        "Your pod reviews your applications before you hit send",
      ],
      isFinal: true,
    },
  ],
  pod: {
    members: [
      {
        id: "user",
        initials: "JR",
        name: "You · Jordan R.",
        detail: "Austin, TX · Brand marketing",
        color: "#1E4D48",
        isUser: true,
      },
      {
        id: "maya",
        initials: "MA",
        name: "Maya A.",
        detail: "Atlanta, GA · targeting growth marketing",
        color: "#C45A2E",
      },
      {
        id: "devon",
        initials: "DC",
        name: "Devon C.",
        detail: "Seattle, WA · content + brand",
        color: "#3B6EA8",
      },
      {
        id: "priya",
        initials: "PS",
        name: "Priya S.",
        detail: "Columbus, OH · product marketing",
        color: "#7B5EA7",
      },
      {
        id: "liam",
        initials: "LN",
        name: "Liam N.",
        detail: "Denver, CO · social + community",
        color: "#8B6F47",
      },
      {
        id: "tasha",
        initials: "TR",
        name: "Tasha R.",
        detail: "Miami, FL · brand marketing",
        color: "#2D6A4F",
      },
    ],
    meetingDay: "Thursdays",
    meetingTime: "7:00 PM ET",
    stats: [
      { value: "6", label: "people, same stage" },
      { value: "Weekly", label: "30 min check-in" },
      { value: "1", label: "shared accountability board" },
      { value: "2.4x", label: "completion vs going solo" },
    ],
    mapPositions: [
      { memberId: "devon", top: "18%", left: "22%" },
      { memberId: "liam", top: "12%", left: "58%" },
      { memberId: "priya", top: "38%", left: "72%" },
      { memberId: "user", top: "52%", left: "42%" },
      { memberId: "maya", top: "62%", left: "18%" },
      { memberId: "tasha", top: "72%", left: "68%" },
    ],
  },
  mentor: {
    initials: "RO",
    name: "Renee Okafor",
    title: "Director of Brand Marketing · 12 years · has hired 30+ associates",
    tags: ["Brand & content", "Hiring manager", "Volunteers 1 hr / week"],
    quote:
      "I hire for proof you can ship. A polished deck is nice. A campaign with a number — reach, signups, revenue — is what gets the callback.",
    sessions: [
      {
        number: 1,
        title: "First session: a 20 minute read",
        description:
          "Renee reviews your skill gaps with the pod and flags the one that matters most for your re-applications.",
      },
      {
        number: 2,
        title: "Mid-journey: portfolio review",
        description:
          "She reacts to your nonprofit campaign case study the way a real hiring manager would.",
      },
    ],
    firstSessionLabel: "First mentor session: Thursday, June 25 · 7:00 PM ET",
  },
};

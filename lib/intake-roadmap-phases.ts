import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import { roleIdToSprintSlug } from "@/lib/intake-roadmap";
import {
  getSprintRoadmapBySlug,
  type RoadmapDayNode,
  type SprintRoadmapData,
} from "@/lib/sprint-roadmap-data";
import type { ProfileGapParameter } from "@/lib/profile-gaps";

export type IntakeRoadmapPhase = {
  id: string;
  phaseLabel: string;
  title: string;
  stepMarker: number | "done";
  closeTheGap: string;
  bullets: string[];
  tools: string[];
  claim: string;
};

function uniqueTools(nodes: RoadmapDayNode[], limit = 6): string[] {
  const seen = new Set<string>();
  const tools: string[] = [];

  for (const node of nodes) {
    for (const tool of node.tools) {
      const normalized = tool.trim();
      if (!normalized || seen.has(normalized.toLowerCase())) {
        continue;
      }
      seen.add(normalized.toLowerCase());
      tools.push(normalized);
      if (tools.length >= limit) {
        return tools;
      }
    }
  }

  return tools;
}

function gapCloseLine(param: ProfileGapParameter | undefined, fallback: string): string {
  if (!param) {
    return fallback;
  }
  const need = param.jobRequires.trim();
  if (!need) {
    return fallback;
  }
  if (param.status === "good") {
    return `Strengthen what you already show: ${need}`;
  }
  return `Close the gap: ${need}`;
}

function pickGap(
  parameters: ProfileGapParameter[],
  facet: string,
): ProfileGapParameter | undefined {
  return parameters.find((row) => row.parameter.toLowerCase() === facet.toLowerCase());
}

function pickPrimaryGap(parameters: ProfileGapParameter[]): ProfileGapParameter | undefined {
  return (
    parameters.find((row) => row.status === "missing") ??
    parameters.find((row) => row.status === "stretch") ??
    parameters[0]
  );
}

function deliverableBullet(node: RoadmapDayNode | undefined, prefix: string): string | null {
  if (!node) {
    return null;
  }
  return `${prefix}${node.deliverable}`;
}

function roleNoun(sprint: SprintRoadmapData): string {
  switch (sprint.slug) {
    case "sales":
      return "outreach sprint";
    case "forward-deployed-engineer":
      return "technical build";
    case "marketing":
    default:
      return "campaign";
  }
}

export function buildRoadmapPhases(
  vetting: VettingResult,
  roadmap?: IntakePersonalizedRoadmap | null,
): IntakeRoadmapPhase[] {
  const sprintSlug = roadmap?.sprintSlug ?? roleIdToSprintSlug(vetting.inferredRoleId);
  const sprint = getSprintRoadmapBySlug(sprintSlug) ?? getSprintRoadmapBySlug("marketing")!;
  const gaps = vetting.gapParameters ?? [];
  const domainGap = pickGap(gaps, "Domain expertise");
  const skillsGap = pickGap(gaps, "Skills");
  const leadershipGap = pickGap(gaps, "Leadership experience");
  const primaryGap = pickPrimaryGap(gaps);

  const early = sprint.week1.slice(0, 3);
  const mid = [...sprint.week1.slice(3), ...sprint.week2.slice(0, 2)];
  const proof = sprint.week2.slice(2, 6);
  const ship = sprint.week2[sprint.week2.length - 1];

  const analyticsTools = uniqueTools(
    [
      { tools: ["Google Analytics 4", "SQL", "Claude", "Perplexity", "Notion AI"] } as RoadmapDayNode,
      ...early,
    ],
    6,
  );

  const aiTools = uniqueTools(mid, 6);
  const proofTools = uniqueTools(proof, 7);

  const proofArtifactNames = sprint.proofArtifacts
    .slice(0, 3)
    .map((artifact) => artifact.name)
    .join(", ");

  const noun = roleNoun(sprint);

  return [
    {
      id: "analytics",
      phaseLabel: "Weeks 1 to 2 · Analytics",
      title: "Speak the language of results",
      stepMarker: 1,
      closeTheGap: gapCloseLine(
        domainGap,
        `Close the gap: Show credible ${vetting.inferredRoleLabel} experience on paper and in conversation.`,
      ),
      bullets: [
        gapCloseLine(
          domainGap,
          `Close the gap: Document how your background maps to ${vetting.inferredRoleLabel} expectations.`,
        ),
        deliverableBullet(early[0], "Define your target: ") ??
          "Write a one-page ICP or audience brief tied to your target role.",
        deliverableBullet(early[1], "Build your list: ") ??
          "Create a tracked pipeline of real prospects, roles, or project targets.",
        "Rewrite three résumé bullets as action → metric (%, $, time saved, volume).",
      ],
      tools: analyticsTools,
      claim: `You can claim metric-literate ${sprint.title.toLowerCase()} fundamentals — not just task lists.`,
    },
    {
      id: "ai-fluency",
      phaseLabel: "Weeks 2 to 4 · AI Fluency",
      title: "Run AI like a manager, not a tourist",
      stepMarker: 2,
      closeTheGap: gapCloseLine(
        skillsGap,
        "Close the gap: Ship repeatable AI workflows employers expect in entry-level roles.",
      ),
      bullets: [
        gapCloseLine(
          skillsGap,
          "Close the gap: Name specific tools and workflows you've run end-to-end.",
        ),
        deliverableBullet(mid[0], "Workflow: ") ??
          "Document a brief → generate → edit → publish pipeline you can repeat.",
        deliverableBullet(mid[1], "Ship: ") ??
          "Use an AI agent to draft, score, and iterate one real deliverable.",
        "These are non-negotiable in 2026 — you will point to prompts, stacks, and outputs.",
      ],
      tools: aiTools.length > 0 ? aiTools : ["Claude", "Cursor", "Make / Zapier", "Notion AI"],
      claim: "You can claim you design AI workflows — not just paste prompts.",
    },
    {
      id: "proof",
      phaseLabel: "Weeks 3 to 6 · Proof",
      title: "A real project with a real number",
      stepMarker: 3,
      closeTheGap: gapCloseLine(
        leadershipGap ?? primaryGap,
        `Close the gap: Ship a shareable ${noun} with outcomes you can defend.`,
      ),
      bullets: [
        gapCloseLine(
          leadershipGap ?? primaryGap,
          `Close the gap: Prove ownership with a public artifact for ${vetting.inferredRoleLabel}.`,
        ),
        deliverableBullet(proof[0], "Execute: ") ??
          `Run a live ${noun} — publish, send, or demo for a real audience.`,
        deliverableBullet(proof[1], "Measure: ") ??
          "Report the result: reach, signups, replies, calls booked, or dollars raised.",
        deliverableBullet(ship, "Publish: ") ??
          `Turn the work into a portfolio case study and one LinkedIn post.`,
      ],
      tools: proofTools,
      claim: proofArtifactNames
        ? `You can claim tangible proof: ${proofArtifactNames}.`
        : `You can claim a shipped ${noun} with metrics and a public write-up.`,
    },
    {
      id: "re-apply",
      phaseLabel: "Week 6 · Re-apply",
      title: "Go back stronger",
      stepMarker: "done",
      closeTheGap: "Close the gap: Re-enter the market with evidence — not the same résumé.",
      bullets: [
        "dear[CC] resurfaces 8 to 12 roles where you now have an edge.",
        "Your pod reviews your applications before you hit send.",
        roadmap?.promise ??
          sprint.promise ??
          "Re-apply with your proof-of-work linked in every outreach.",
      ],
      tools: ["dear[CC]", "LinkedIn", "Loom", "Notion"],
      claim: "You can claim you re-applied with portfolio proof, peer review, and role-matched targeting.",
    },
  ];
}

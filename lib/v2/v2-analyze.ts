import type { JobFitResult } from "@/lib/job-fit";
import type { ParsedProfileInsight } from "@/lib/profile-parse";
import { V2_SAMPLE_ANALYSIS } from "@/lib/v2/v2-sample";
import type { V2Analysis, V2JourneyPhase, V2SkillBar } from "@/lib/v2/v2-types";

const FIXED_CRITERIA = new Set([
  "years of experience",
  "leadership",
  "team management",
]);

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "??";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function nameFromLinkedInUrl(url: string): string {
  try {
    const pathname = new URL(url.trim()).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    if (!slug || slug === "in") {
      return "You";
    }
    const words = slug.replace(/[-_]+/g, " ").split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return "You";
    }
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  } catch {
    return "You";
  }
}

function scoreFromStatus(status: "strong" | "partial" | "missing" | undefined): number {
  if (status === "strong") {
    return 70 + Math.floor(Math.random() * 20);
  }
  if (status === "partial") {
    return 30 + Math.floor(Math.random() * 15);
  }
  return 15 + Math.floor(Math.random() * 15);
}

function tierFromScore(score: number, isGap: boolean): V2SkillBar["tier"] {
  if (isGap) {
    return "Gap";
  }
  return score >= 72 ? "Strong" : "Solid";
}

function parseJobMeta(roleTitle: string, jobText: string): {
  title: string;
  company: string;
  location: string;
} {
  const title = roleTitle.trim() || "Target role";
  const companyMatch = jobText.match(/(?:at|@)\s+([A-Z][A-Za-z0-9&.'\-\s]{1,40})/);
  const locationMatch = jobText.match(
    /([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:\s*\([^)]+\))?)/,
  );

  return {
    title,
    company: companyMatch?.[1]?.trim() ?? "Company",
    location: locationMatch?.[1]?.trim() ?? "Remote or hybrid",
  };
}

function classifyGapForPhase(gap: string): "analytics" | "ai" | "proof" {
  const lower = gap.toLowerCase();
  if (
    lower.includes("sql") ||
    lower.includes("analytics") ||
    lower.includes("ga4") ||
    lower.includes("metric") ||
    lower.includes("data")
  ) {
    return "analytics";
  }
  if (lower.includes("ai") || lower.includes("agent") || lower.includes("workflow")) {
    return "ai";
  }
  return "proof";
}

function buildJourney(gapsToClose: string[]): V2JourneyPhase[] {
  const template = V2_SAMPLE_ANALYSIS.journey;
  const phaseBullets: Record<string, string[]> = {
    analytics: [...template[0]!.bullets],
    ai: [...template[1]!.bullets],
    proof: [...template[2]!.bullets],
  };

  for (const gap of gapsToClose.slice(0, 3)) {
    const phase = classifyGapForPhase(gap);
    phaseBullets[phase]!.unshift(`Close the gap: ${gap}`);
  }

  return [
    { ...template[0]!, bullets: phaseBullets.analytics!.slice(0, 4) },
    { ...template[1]!, bullets: phaseBullets.ai!.slice(0, 4) },
    { ...template[2]!, bullets: phaseBullets.proof!.slice(0, 4) },
    template[3]!,
  ];
}

function personalizePod(candidateName: string, analysis: V2Analysis): V2Analysis["pod"] {
  const firstName = candidateName.split(/\s+/)[0] ?? "You";
  const members = analysis.pod.members.map((member) => {
    if (!member.isUser) {
      return member;
    }
    return {
      ...member,
      name: `You · ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}.`,
      initials: initialsFromName(candidateName),
    };
  });

  return { ...analysis.pod, members };
}

export function mapJobFitToV2Analysis(input: {
  result: JobFitResult;
  jobText: string;
  linkedInUrl: string;
  profileInsight: ParsedProfileInsight | null;
}): V2Analysis {
  const { result, jobText, linkedInUrl, profileInsight } = input;
  const candidateName = nameFromLinkedInUrl(linkedInUrl);
  const jobMeta = parseJobMeta(result.roleTitle, jobText);

  const domainRows = result.fitMatrix.filter(
    (row) => !FIXED_CRITERIA.has(row.criteria.toLowerCase()),
  );

  const strengths: V2SkillBar[] = domainRows
    .filter((row) => row.status === "strong")
    .slice(0, 3)
    .map((row) => {
      const score = scoreFromStatus(row.status);
      return {
        label: row.criteria,
        score,
        tier: tierFromScore(score, false),
      };
    });

  const gaps: V2SkillBar[] = domainRows
    .filter((row) => row.status === "missing" || row.status === "partial")
    .slice(0, 3)
    .map((row) => ({
      label: row.criteria,
      score: scoreFromStatus(row.status),
      tier: "Gap" as const,
    }));

  if (strengths.length < 3) {
    const fallbackStrengths = result.fitMatrix
      .filter((row) => row.status === "strong" && !strengths.some((s) => s.label === row.criteria))
      .slice(0, 3 - strengths.length);
    for (const row of fallbackStrengths) {
      const score = scoreFromStatus(row.status);
      strengths.push({ label: row.criteria, score, tier: tierFromScore(score, false) });
    }
  }

  if (gaps.length < 3 && result.gapsToClose.length > 0) {
    for (const gap of result.gapsToClose) {
      if (gaps.length >= 3) {
        break;
      }
      if (!gaps.some((g) => g.label === gap)) {
        gaps.push({ label: gap, score: scoreFromStatus("missing"), tier: "Gap" });
      }
    }
  }

  while (strengths.length < 3) {
    const filler = V2_SAMPLE_ANALYSIS.strengths[strengths.length];
    if (filler) {
      strengths.push(filler);
    } else {
      break;
    }
  }

  while (gaps.length < 3) {
    const filler = V2_SAMPLE_ANALYSIS.gaps[gaps.length];
    if (filler) {
      gaps.push(filler);
    } else {
      break;
    }
  }

  const summaryParts = [
    profileInsight?.suggestedSeniority ? `${profileInsight.suggestedSeniority}` : null,
    profileInsight?.suggestedRoles?.[0] ? `targeting ${profileInsight.suggestedRoles[0]}` : null,
    result.summary ? result.summary.split(".")[0] : null,
  ].filter(Boolean);

  const base: V2Analysis = {
    job: {
      title: jobMeta.title,
      company: jobMeta.company,
      location: jobMeta.location,
      appliedDate: `applied ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      initials: initialsFromName(jobMeta.company),
      sourceLabel: "Read from job post",
    },
    candidate: {
      name: candidateName,
      summary: summaryParts.join(" · ") || result.headline || "Early-career candidate",
      initials: initialsFromName(candidateName),
      sourceLabel: "Read from LinkedIn",
    },
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    journey: buildJourney(result.gapsToClose),
    pod: V2_SAMPLE_ANALYSIS.pod,
    mentor: V2_SAMPLE_ANALYSIS.mentor,
  };

  return {
    ...base,
    pod: personalizePod(candidateName, base),
  };
}

export function personalizeSampleAnalysis(candidateName?: string): V2Analysis {
  const name = candidateName?.trim() || V2_SAMPLE_ANALYSIS.candidate.name;
  return {
    ...V2_SAMPLE_ANALYSIS,
    candidate: {
      ...V2_SAMPLE_ANALYSIS.candidate,
      name,
      initials: initialsFromName(name),
    },
    pod: personalizePod(name, V2_SAMPLE_ANALYSIS),
  };
}

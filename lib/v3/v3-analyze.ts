import type { JobFitResult } from "@/lib/job-fit";
import type { ParsedProfileInsight } from "@/lib/profile-parse";
import { V3_SAMPLE_ANALYSIS } from "@/lib/v3/v3-sample";
import type { V3Analysis, V3JourneyPhase, V3SkillBar } from "@/lib/v3/v3-types";

const FIXED_CRITERIA = new Set([
  "years of experience",
  "leadership",
  "team management",
]);

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function nameFromLinkedInUrl(url: string): string {
  try {
    const slug = new URL(url.trim()).pathname.split("/").filter(Boolean).pop() ?? "";
    if (!slug || slug === "in") return "You";
    return slug
      .replace(/[-_]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return "You";
  }
}

function scoreFromStatus(status: "strong" | "partial" | "missing" | undefined, seed: string): number {
  const hash = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (status === "strong") return 70 + (hash % 20);
  if (status === "partial") return 30 + (hash % 15);
  return 15 + (hash % 15);
}

function tierFromScore(score: number, isGap: boolean): V3SkillBar["tier"] {
  if (isGap) return "Gap";
  return score >= 72 ? "Strong" : "Solid";
}

function parseJobMeta(roleTitle: string, jobText: string) {
  const title = roleTitle.trim() || "Target role";
  const companyMatch = jobText.match(/(?:at|@)\s+([A-Z][A-Za-z0-9&.'\-\s]{1,40})/);
  const locationMatch = jobText.match(/([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:\s*\([^)]+\))?)/);
  return {
    title,
    company: companyMatch?.[1]?.trim() ?? "Company",
    location: locationMatch?.[1]?.trim() ?? "Remote or hybrid",
  };
}

function classifyGapForPhase(gap: string): "analytics" | "ai" | "proof" {
  const lower = gap.toLowerCase();
  if (/sql|analytics|ga4|metric|data|attribution/.test(lower)) return "analytics";
  if (/ai|agent|workflow|content/.test(lower)) return "ai";
  return "proof";
}

function buildJourney(gapsToClose: string[]): V3JourneyPhase[] {
  const template = V3_SAMPLE_ANALYSIS.journey;
  const phaseBullets: Record<string, string[]> = {
    analytics: [...template[0]!.bullets],
    ai: [...template[1]!.bullets],
    proof: [...template[2]!.bullets],
  };

  for (const gap of gapsToClose.slice(0, 3)) {
    phaseBullets[classifyGapForPhase(gap)]!.unshift(`Target: ${gap}`);
  }

  return [
    { ...template[0]!, bullets: phaseBullets.analytics!.slice(0, 4) },
    { ...template[1]!, bullets: phaseBullets.ai!.slice(0, 4) },
    { ...template[2]!, bullets: phaseBullets.proof!.slice(0, 4) },
    template[3]!,
  ];
}

function personalizePod(candidateName: string, analysis: V3Analysis): V3Analysis["pod"] {
  const firstName = candidateName.split(/\s+/)[0] ?? "You";
  return {
    ...analysis.pod,
    members: analysis.pod.members.map((member) =>
      member.isUser
        ? {
            ...member,
            name: `You · ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}.`,
            initials: initialsFromName(candidateName),
          }
        : member,
    ),
  };
}

function buildJourneyStats(gapCount: number): V3Analysis["journeyStats"] {
  return [
    {
      value: `${gapCount} gap${gapCount === 1 ? "" : "s"}`,
      label: "targeted, not a generic bootcamp",
      detail: "",
    },
    { value: "~5 hrs / week", label: "designed to fit around job hunting", detail: "" },
    { value: "1 real artifact", label: "a campaign with a number attached", detail: "" },
  ];
}

export function mapJobFitToV3Analysis(input: {
  result: JobFitResult;
  jobText: string;
  linkedInUrl: string;
  profileInsight: ParsedProfileInsight | null;
}): V3Analysis {
  const { result, jobText, linkedInUrl, profileInsight } = input;
  const candidateName = nameFromLinkedInUrl(linkedInUrl);
  const jobMeta = parseJobMeta(result.roleTitle, jobText);

  const domainRows = result.fitMatrix.filter(
    (row) => !FIXED_CRITERIA.has(row.criteria.toLowerCase()),
  );

  const strengths: V3SkillBar[] = domainRows
    .filter((row) => row.status === "strong")
    .slice(0, 3)
    .map((row) => {
      const score = scoreFromStatus(row.status, row.criteria);
      return { label: row.criteria, score, tier: tierFromScore(score, false) };
    });

  const gaps: V3SkillBar[] = domainRows
    .filter((row) => row.status === "missing" || row.status === "partial")
    .slice(0, 3)
    .map((row) => ({
      label: row.criteria,
      score: scoreFromStatus(row.status, row.criteria),
      tier: "Gap" as const,
    }));

  for (const row of result.fitMatrix.filter((r) => r.status === "strong")) {
    if (strengths.length >= 3) break;
    if (!strengths.some((s) => s.label === row.criteria)) {
      const score = scoreFromStatus(row.status, row.criteria);
      strengths.push({ label: row.criteria, score, tier: tierFromScore(score, false) });
    }
  }

  for (const gap of result.gapsToClose) {
    if (gaps.length >= 3) break;
    if (!gaps.some((g) => g.label === gap)) {
      gaps.push({ label: gap, score: scoreFromStatus("missing", gap), tier: "Gap" });
    }
  }

  while (strengths.length < 3) {
    const filler = V3_SAMPLE_ANALYSIS.strengths[strengths.length];
    if (filler) strengths.push(filler);
    else break;
  }
  while (gaps.length < 3) {
    const filler = V3_SAMPLE_ANALYSIS.gaps[gaps.length];
    if (filler) gaps.push(filler);
    else break;
  }

  const summaryParts = [
    profileInsight?.suggestedSeniority,
    profileInsight?.suggestedRoles?.[0] ? `targeting ${profileInsight.suggestedRoles[0]}` : null,
    result.headline,
  ].filter(Boolean);

  const gapCount = gaps.length;
  const base: V3Analysis = {
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
      summary: summaryParts.join(" · ") || "Early-career candidate",
      initials: initialsFromName(candidateName),
      sourceLabel: "Read from LinkedIn",
    },
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    journey: buildJourney(result.gapsToClose.length ? result.gapsToClose : gaps.map((g) => g.label)),
    journeyStats: buildJourneyStats(gapCount),
    pod: V3_SAMPLE_ANALYSIS.pod,
    mentor: V3_SAMPLE_ANALYSIS.mentor,
  };

  return { ...base, pod: personalizePod(candidateName, base) };
}

export function personalizeSampleAnalysis(candidateName?: string): V3Analysis {
  const name = candidateName?.trim() || V3_SAMPLE_ANALYSIS.candidate.name;
  const analysis = {
    ...V3_SAMPLE_ANALYSIS,
    candidate: {
      ...V3_SAMPLE_ANALYSIS.candidate,
      name,
      initials: initialsFromName(name),
    },
  };
  return { ...analysis, pod: personalizePod(name, analysis) };
}

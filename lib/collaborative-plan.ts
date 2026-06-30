import type { ProfileGapParameter } from "@/lib/profile-gaps";
import type { RoadmapDayNode } from "@/lib/sprint-roadmap-data";

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function collectGapTerms(parameters: ProfileGapParameter[]): string[] {
  const terms = new Set<string>();

  for (const row of parameters) {
    if (row.status === "good") {
      continue;
    }

    for (const token of [row.parameter, row.jobRequires, ...row.keywords]) {
      const normalized = normalizeForMatch(token);
      if (normalized.length >= 3) {
        terms.add(normalized);
      }
      for (const word of normalized.split(" ")) {
        if (word.length >= 4) {
          terms.add(word);
        }
      }
    }
  }

  return [...terms];
}

function nodeMatchesGapTerms(node: RoadmapDayNode, gapTerms: string[]): boolean {
  const haystack = normalizeForMatch(
    [node.theme, node.deliverable, ...node.tools].join(" "),
  );

  return gapTerms.some((term) => {
    if (term.length < 4) {
      return false;
    }
    return haystack.includes(term);
  });
}

export function suggestMarkedNodeIds(
  nodes: RoadmapDayNode[],
  parameters: ProfileGapParameter[],
): string[] {
  const gapTerms = collectGapTerms(parameters);
  if (gapTerms.length === 0) {
    return nodes.slice(0, 2).map((node) => node.id);
  }

  const matched = nodes.filter((node) => nodeMatchesGapTerms(node, gapTerms)).map((node) => node.id);

  if (matched.length === 0) {
    return nodes.slice(0, 2).map((node) => node.id);
  }

  return matched.slice(0, 5);
}

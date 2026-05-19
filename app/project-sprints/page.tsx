import type { Metadata } from "next";

import { AiTracksGuide } from "@/app/components/AiTracksGuide";
import { AI_SPRINTS_GUIDE_TITLE } from "@/lib/ai-tracks-data";

export const metadata: Metadata = {
  title: `${AI_SPRINTS_GUIDE_TITLE} — JobClaw`,
  description:
    "Six two-week solo AI sprints for AI-first roles: comps pipelines, strategy prototypes, shipped features with evals, domain RAG, regulatory trackers, and audited clinical extraction.",
};

export default function ProjectSprintsPage() {
  return (
    <AiTracksGuide
      eyebrow="JobClaw · Project sprints"
      title={AI_SPRINTS_GUIDE_TITLE}
      itemLabel="Sprint"
    />
  );
}

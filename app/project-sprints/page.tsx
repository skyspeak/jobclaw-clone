import type { Metadata } from "next";

import { AiTracksGuide } from "@/app/components/AiTracksGuide";
import {
  AI_PROJECT_SPRINTS,
  AI_PROJECT_SPRINTS_INTRO,
  AI_PROJECT_SPRINTS_PATTERN,
  AI_SPRINTS_GUIDE_TITLE,
} from "@/lib/ai-tracks-data";

export const metadata: Metadata = {
  title: `${AI_SPRINTS_GUIDE_TITLE} — JobClaw`,
  description:
    "Two two-week solo AI sprints: AI Marketer (GTM narratives, intel digests, validated campaigns) and Forward Deployed Engineer (deployed pipelines, RAG, and evals).",
};

export default function ProjectSprintsPage() {
  return (
    <AiTracksGuide
      eyebrow="JobClaw · Project sprints"
      title={AI_SPRINTS_GUIDE_TITLE}
      itemLabel="Sprint"
      tracks={AI_PROJECT_SPRINTS}
      intro={AI_PROJECT_SPRINTS_INTRO}
      pattern={AI_PROJECT_SPRINTS_PATTERN}
      showDownload={false}
    />
  );
}

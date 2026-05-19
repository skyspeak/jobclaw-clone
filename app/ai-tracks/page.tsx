import type { Metadata } from "next";

import { AiTracksGuide } from "@/app/components/AiTracksGuide";
import { AI_TRACKS_GUIDE_TITLE } from "@/lib/ai-tracks-data";

export const metadata: Metadata = {
  title: `${AI_TRACKS_GUIDE_TITLE} — JobClaw`,
  description:
    "Six two-week solo AI tracks for AI-first roles: comps pipelines, strategy prototypes, shipped features with evals, domain RAG, regulatory trackers, and audited clinical extraction.",
};

export default function AiTracksPage() {
  return <AiTracksGuide eyebrow="JobClaw · AI tracks" />;
}

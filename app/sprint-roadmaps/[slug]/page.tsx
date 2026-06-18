import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SprintRoadmapView } from "@/app/components/SprintRoadmapView";
import { getSprintRoadmapBySlug, PROJECT_SPRINT_SLUGS } from "@/lib/sprint-roadmap-data";
import { BRAND_NAME } from "@/lib/brand";

type SprintRoadmapPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PROJECT_SPRINT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SprintRoadmapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const roadmap = getSprintRoadmapBySlug(slug);

  if (!roadmap) {
    return { title: `Roadmap not found — ${BRAND_NAME}` };
  }

  return {
    title: `${roadmap.title} Sprint Roadmap — ${BRAND_NAME}`,
    description: roadmap.subtitle,
  };
}

export default async function SprintRoadmapPage({ params }: SprintRoadmapPageProps) {
  const { slug } = await params;
  const roadmap = getSprintRoadmapBySlug(slug);

  if (!roadmap) {
    notFound();
  }

  return <SprintRoadmapView roadmap={roadmap} />;
}

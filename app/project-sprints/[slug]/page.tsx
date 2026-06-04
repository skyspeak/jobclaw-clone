import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AiTracksGuide } from "@/app/components/AiTracksGuide";
import { AI_PROJECT_SPRINTS_INTRO, PROJECT_SPRINT_SLUGS, getProjectSprintBySlug } from "@/lib/ai-tracks-data";
import { BRAND_NAME } from "@/lib/brand";

type SprintPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PROJECT_SPRINT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SprintPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sprint = getProjectSprintBySlug(slug);

  if (!sprint) {
    return { title: `Project sprint — ${BRAND_NAME}` };
  }

  return {
    title: `${sprint.title} sprint — ${BRAND_NAME}`,
    description: sprint.subtitle,
  };
}

export default async function ProjectSprintPage({ params }: SprintPageProps) {
  const { slug } = await params;
  const sprint = getProjectSprintBySlug(slug);

  if (!sprint) {
    notFound();
  }

  const sprintSlug = (sprint.slug ?? sprint.id) as (typeof PROJECT_SPRINT_SLUGS)[number];

  return (
    <AiTracksGuide
      eyebrow={`${BRAND_NAME} · ${sprint.title}`}
      title={`${sprint.title} — two-week sprint`}
      itemLabel="Sprint"
      tracks={[sprint]}
      intro={{
        ...AI_PROJECT_SPRINTS_INTRO,
        throughline: sprint.subtitle,
      }}
      showDownload={false}
      stickyCommit
      sprintNav={{ slug: sprintSlug, title: sprint.title }}
    />
  );
}

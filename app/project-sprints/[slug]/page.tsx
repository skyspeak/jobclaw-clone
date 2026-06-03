import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AiTracksGuide } from "@/app/components/AiTracksGuide";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      <div className="brand-bg px-4 pt-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-3">
          <Button variant="outline" asChild className="rounded-2xl">
            <Link href="/project-sprints">All project sprints</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-2xl">
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-2xl">
            <Link href={`/pairing?track=${slug}`}>Find cohort</Link>
          </Button>
        </div>
      </div>
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
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PairingFlow } from "@/app/components/PairingFlow";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Sprint cohort matching — ${BRAND_NAME}`,
  description:
    "Get matched with 2–4 job seekers on your Marketing, Sales, or FDE project sprint track.",
};

type PairingPageProps = {
  searchParams: Promise<{ track?: string }>;
};

function PairingContent({ track }: { track?: string }) {
  return <PairingFlow initialTrack={track ?? null} />;
}

export default async function PairingPage({ searchParams }: PairingPageProps) {
  const { track } = await searchParams;

  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/project-sprints">← All project sprints</Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground" aria-live="polite">
            Loading cohort matcher…
          </p>
        }
      >
        <PairingContent track={track} />
      </Suspense>
    </main>
  );
}

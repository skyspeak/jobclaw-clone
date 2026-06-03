"use client";

import { BRAND_NAME } from "@/lib/brand";
import { sprintSlugToPairingTrack } from "@/lib/pairing/constants";

import { PairingQueueContent } from "@/app/components/PairingQueueContent";

type PairingFlowProps = {
  initialTrack?: string | null;
};

export function PairingFlow({ initialTrack }: PairingFlowProps) {
  const preselected = sprintSlugToPairingTrack(initialTrack ?? "") ?? undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-24">
      <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {BRAND_NAME} · Sprint cohort
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
          Find your sprint cohort
        </h1>
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
          We match you with 2–4 job seekers on the same track—Marketing, Sales, or Forward Deployed
          Engineer. When your group is ready, you get everyone&apos;s name and email to introduce
          yourselves.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Groups lock at 4 people or after about 10 minutes in the queue (minimum 2 per group).
        </p>
      </header>

      <PairingQueueContent initialTrack={preselected} idPrefix="pairing-page" />
    </div>
  );
}

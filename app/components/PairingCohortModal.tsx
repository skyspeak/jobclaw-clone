"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { PairingQueueContent } from "@/app/components/PairingQueueContent";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import type { PairingTrack } from "@/lib/pairing/types";
import { cn } from "@/lib/utils";

type PairingCohortModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackTitle: string;
  pairingTrack: PairingTrack | null;
  initialEmail?: string;
  initialUserId?: string;
};

export function PairingCohortModal({
  open,
  onOpenChange,
  trackTitle,
  pairingTrack,
  initialEmail,
  initialUserId,
}: PairingCohortModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pairing-cohort-modal-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "relative flex max-h-[min(90dvh,820px)] w-full max-w-lg flex-col overflow-hidden",
          "rounded-3xl border border-border/70 bg-background shadow-2xl",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {BRAND_NAME} · Sprint cohort
            </p>
            <h2 id="pairing-cohort-modal-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
              Find your cohort
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {pairingTrack ? (
            <PairingQueueContent
              initialTrack={pairingTrack}
              initialEmail={initialEmail}
              initialUserId={initialUserId}
              lockTrack
              compact
              trackTitle={trackTitle}
              idPrefix="cohort-modal"
              restoreSession={!initialUserId}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cohort matching is available for Marketing, Sales, and Forward Deployed Engineer
                project sprints.
              </p>
              <Button asChild className="cta-glow rounded-2xl">
                <Link href="/pairing">Browse sprint cohorts</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

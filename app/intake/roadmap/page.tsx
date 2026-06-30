import type { Metadata } from "next";
import Link from "next/link";

import { IntakePersonalizedRoadmapView } from "@/app/components/IntakePersonalizedRoadmapView";

export const metadata: Metadata = {
  title: "Your roadmap — dear[CC]",
  description: "Your personalized 6-week career sprint roadmap.",
};

export default function IntakeRoadmapPage() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden brand-bg selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-md pt-[max(0px,env(safe-area-inset-top))]">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-3 py-2 sm:px-6 sm:py-3">
          <Link
            className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
            href="/"
          >
            dear[CC]
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <IntakePersonalizedRoadmapView />
      </div>
    </main>
  );
}

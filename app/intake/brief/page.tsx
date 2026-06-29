import type { Metadata } from "next";
import Link from "next/link";

import { IntakeBriefResults } from "@/app/components/IntakeBriefResults";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My brief — dear[CC]",
  description: "Your completed intake brief and next steps.",
};

export default function IntakeBriefPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] selection:bg-primary selection:text-primary-foreground sm:px-8 sm:py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8 sm:gap-8 sm:pb-24">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            <Link className="text-foreground underline-offset-4 hover:underline" href="/">
              dear[CC]
            </Link>
          </div>
          <Button variant="outline" asChild className="min-h-11 touch-manipulation rounded-2xl">
            <Link href="/">← Back to home</Link>
          </Button>
        </header>

        <IntakeBriefResults />
      </div>
    </main>
  );
}

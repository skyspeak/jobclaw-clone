import type { Metadata } from "next";
import Link from "next/link";

import { IntakeBriefResults } from "@/app/components/IntakeBriefResults";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My brief — JobClaw",
  description: "Your completed intake brief and next steps.",
};

export default function IntakeBriefPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-24">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
            <Link className="text-foreground underline-offset-4 hover:underline" href="/">
              JOBCLAW
            </Link>
          </div>
          <Button variant="outline" asChild className="w-fit rounded-2xl">
            <Link href="/">← Back to home</Link>
          </Button>
        </header>

        <IntakeBriefResults />
      </div>
    </main>
  );
}

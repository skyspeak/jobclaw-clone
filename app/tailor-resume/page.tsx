import Link from "next/link";

import { ResumeTailor } from "@/app/components/ResumeTailor";
import { Button } from "@/components/ui/button";

export default function TailorResumePage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav
        aria-label="Main links"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 md:gap-6"
      >
        <Link className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline sm:text-base" href="/">
          JobClaw
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild size="sm" className="rounded-xl">
            <Link href="/intake">Open intake</Link>
          </Button>
          <Button variant="outline" asChild size="sm" className="rounded-xl">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-6xl px-6 pb-20">
        <ResumeTailor />
      </div>
    </main>
  );
}

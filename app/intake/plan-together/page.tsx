import type { Metadata } from "next";
import Link from "next/link";

import { IntakeCollaborativePlan } from "@/app/components/IntakeCollaborativePlan";

export const metadata: Metadata = {
  title: "Your plan — dear[CC]",
  description: "Co-build a sprint plan tailored to your skill gaps with DearCC.",
};

export default function IntakePlanTogetherPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col brand-bg selection:bg-primary selection:text-primary-foreground">
      <header className="shrink-0 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <Link
          className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
          href="/"
        >
          dear[CC]
        </Link>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
        <IntakeCollaborativePlan />
      </div>
    </main>
  );
}

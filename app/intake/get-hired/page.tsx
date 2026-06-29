import type { Metadata } from "next";
import Link from "next/link";

import { IntakeGetHiredSignup } from "@/app/components/IntakeGetHiredSignup";

export const metadata: Metadata = {
  title: "Stay Relevant — dear[CC]",
  description: "Sign up for weekly emails tuned to your skill gaps.",
};

export default function IntakeGetHiredPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] selection:bg-primary selection:text-primary-foreground sm:px-8 sm:py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pb-8 sm:gap-8 sm:pb-24">
        <header className="flex flex-col gap-4">
          <Link
            className="text-sm font-semibold tracking-wide text-foreground underline-offset-4 hover:underline"
            href="/"
          >
            dear[CC]
          </Link>
        </header>

        <IntakeGetHiredSignup />
      </div>
    </main>
  );
}

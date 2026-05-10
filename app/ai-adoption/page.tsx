import Link from "next/link";

import { RampAdoptionChart } from "@/app/components/RampAdoptionChart";
import { Button } from "@/components/ui/button";

export default function AiAdoptionPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 sm:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-24">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/">Back to home</Link>
        </Button>
        <RampAdoptionChart />
      </section>
    </main>
  );
}

import Link from "next/link";

import { AiReadinessQuiz } from "@/app/components/AiReadinessQuiz";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 sm:px-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-24">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/">Back to home</Link>
        </Button>
        <AiReadinessQuiz />
      </section>
    </main>
  );
}

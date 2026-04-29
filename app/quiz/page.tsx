import Link from "next/link";

import { AiReadinessQuiz } from "@/app/components/AiReadinessQuiz";

export default function QuizPage() {
  return (
    <main className="page">
      <section className="main-stack">
        <Link className="button secondary back-link" href="/">
          Back to chat
        </Link>
        <AiReadinessQuiz />
      </section>
    </main>
  );
}

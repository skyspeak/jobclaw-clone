import { AiCompetenceCrossword } from "@/app/components/AiCompetenceCrossword";
import { AiReadinessQuiz } from "@/app/components/AiReadinessQuiz";

export default function Home() {
  return (
    <main className="page">
      <section className="main-stack">
        <AiReadinessQuiz />
        <AiCompetenceCrossword />
      </section>
    </main>
  );
}

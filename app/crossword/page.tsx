import Link from "next/link";

import { AiCompetenceCrossword } from "@/app/components/AiCompetenceCrossword";

export default function CrosswordPage() {
  return (
    <main className="page">
      <section className="main-stack">
        <Link className="button secondary back-link" href="/">
          Back to chat
        </Link>
        <AiCompetenceCrossword />
      </section>
    </main>
  );
}

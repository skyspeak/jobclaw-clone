import Link from "next/link";

import { ChatIntake } from "@/app/components/ChatIntake";

export default function Home() {
  return (
    <main className="page">
      <section className="hosted-home">
        <ChatIntake />
        <aside className="side-callouts" aria-label="Extra experiences">
          <div className="card callout-card">
            <p className="eyebrow">AI readiness quiz</p>
            <h2>Can you work with AI without getting fooled by it?</h2>
            <p className="muted">
              Five quick questions. Get a readiness score and share it.
            </p>
            <Link className="button secondary" href="/quiz">
              Take the quiz
            </Link>
          </div>

          <div className="card callout-card">
            <p className="eyebrow">Entertain me</p>
            <h2>Play the AI competence crossword.</h2>
            <p className="muted">
              Race the timer with TOKEN, LAYER, NEURAL, TRANSFORMER, and AGENT.
            </p>
            <Link className="button secondary" href="/crossword">
              Play crossword
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

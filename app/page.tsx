import Link from "next/link";

import { ChatIntake } from "@/app/components/ChatIntake";

export default function Home() {
  return (
    <main className="page">
      <nav className="home-nav" aria-label="Main links">
        <Link href="/">JobClaw Hosted</Link>
        <div className="home-nav-links">
          <Link href="/admin">Admin</Link>
          <Link href="/ai-adoption">Ramp AI adoption chart</Link>
        </div>
      </nav>
      <section className="hosted-home">
        <ChatIntake />
        <aside className="side-callouts" aria-label="Extra experiences">
          <div className="card callout-card">
            <p className="eyebrow">Ramp data</p>
            <h2>AI adoption is accelerating by sector.</h2>
            <p className="muted">
              View a time-series chart of business AI adoption. Source credited to Ramp.
            </p>
            <Link className="button secondary" href="/ai-adoption">
              View adoption chart
            </Link>
          </div>

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

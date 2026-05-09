import Link from "next/link";

import { MicroInternshipsProgram } from "@/app/components/MicroInternshipsProgram";

export default function MicroInternshipsPage() {
  return (
    <main className="page">
      <nav className="home-nav" aria-label="Main links">
        <Link href="/">DearCC presents JobClaw</Link>
      </nav>
      <section className="hosted-home">
        <MicroInternshipsProgram />
        <aside className="side-callouts" aria-label="Extra experiences">
          <div className="card callout-card">
            <p className="eyebrow">Turn-taking intake</p>
            <h2>Answer the five JobClaw prompts.</h2>
            <p className="muted">
              Same chat flow this micro-internship walkthrough references—save answers before you run
              the matcher.
            </p>
            <Link className="button secondary" href="/">
              Open intake chat
            </Link>
          </div>

          <div className="card callout-card">
            <p className="eyebrow">AI readiness quiz</p>
            <h2>Quick gut-check on verification habits.</h2>
            <p className="muted">Five questions. Share your score after the walkthrough.</p>
            <Link className="button secondary" href="/quiz">
              Take the quiz
            </Link>
          </div>

          <div className="card callout-card">
            <p className="eyebrow">Ramp data</p>
            <h2>AI adoption by sector.</h2>
            <p className="muted">Time-series chart sourced from Ramp.</p>
            <Link className="button secondary" href="/ai-adoption">
              View chart
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

import { mvpServiceChoices, searchRunnerOptions } from "@/lib/saas";

type Tab = "search" | "improvements";

export function ImprovementNotesTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <aside className="card side-card" aria-label="DearCC presents JobClaw implementation notes">
      <div>
        <p className="eyebrow">Build Notes</p>
        <h2>Implementation notes</h2>
      </div>

      <div className="tabs" role="tablist" aria-label="Implementation note sections">
        <button
          aria-selected={activeTab === "search"}
          className="tab"
          role="tab"
          type="button"
          onClick={() => setActiveTab("search")}
        >
          Search runner
        </button>
        <button
          aria-selected={activeTab === "improvements"}
          className="tab"
          role="tab"
          type="button"
          onClick={() => setActiveTab("improvements")}
        >
          Improvement notes
        </button>
      </div>

      {activeTab === "search" ? (
        <section role="tabpanel">
          <h3>Execution strategy</h3>
          <ul className="list">
            {searchRunnerOptions.map((option) => (
              <li key={option.name}>
                <strong>
                  {option.stage}: {option.name}
                </strong>
                <p>{option.tradeoff}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section role="tabpanel">
          <h3>Accounts needed</h3>
          <p className="muted">
            Service checklist for turning the intake into a production platform.
          </p>
          <ul className="list">
            {mvpServiceChoices.map((choice) => (
              <li key={choice.category}>
                <strong>
                  {choice.category}: {choice.recommendation}
                </strong>
                <p className="muted">{choice.accountNeeded}</p>
                <p>{choice.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

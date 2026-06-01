"use client";

import { useState } from "react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mvpServiceChoices, searchRunnerOptions } from "@/lib/saas";
import { cn } from "@/lib/utils";

type Tab = "search" | "improvements";

export function ImprovementNotesTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <aside
      aria-label="dear[CC] implementation notes"
      className="sticky top-6 flex flex-col gap-8 self-start rounded-3xl border border-border bg-card p-8 shadow-sm"
    >
      <CardHeader className="space-y-4 p-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Build Notes</p>
        <CardTitle className="text-xl font-semibold tracking-tight">Implementation notes</CardTitle>
      </CardHeader>

      <div
        className="grid grid-cols-2 gap-1 rounded-[999px] border border-border bg-muted p-1"
        role="tablist"
        aria-label="Implementation note sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "search"}
          className={cn(
            "rounded-full px-4 py-[9px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeTab === "search" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => setActiveTab("search")}
        >
          Search runner
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "improvements"}
          className={cn(
            "rounded-full px-4 py-[9px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeTab === "improvements" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => setActiveTab("improvements")}
        >
          Improvement notes
        </button>
      </div>

      <CardContent className="p-0 pt-6">
        {activeTab === "search" ? (
          <section role="tabpanel">
            <h3 className="mb-6 font-semibold text-foreground">Execution strategy</h3>
            <ul className="m-0 list-none divide-y divide-border p-0">
              {searchRunnerOptions.map((option) => (
                <li className="py-5 first:pt-0" key={option.name}>
                  <p className="mb-2 font-semibold text-[0.9375rem]">
                    <span className="text-muted-foreground">{option.stage}: </span>
                    {option.name}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{option.tradeoff}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section role="tabpanel">
            <h3 className="mb-6 font-semibold text-foreground">Accounts needed</h3>
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
              Service checklist for turning the intake into a production platform.
            </p>
            <ul className="m-0 list-none divide-y divide-border p-0">
              {mvpServiceChoices.map((choice) => (
                <li className="py-5 first:pt-0" key={choice.category}>
                  <p className="mb-2 font-semibold text-[0.9375rem]">
                    {choice.category}: {choice.recommendation}
                  </p>
                  <p className="mb-3 text-sm text-muted-foreground">{choice.accountNeeded}</p>
                  <p className="text-sm leading-relaxed">{choice.why}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </aside>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";

import type { RoadmapDayNode, SprintRoadmapData } from "@/lib/sprint-roadmap-data";

type SprintRoadmapCanvasProps = {
  roadmap: SprintRoadmapData;
};

function RoadmapNode({
  node,
  selected,
  onSelect,
}: {
  node: RoadmapDayNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "roadmap-node group relative w-[11.5rem] shrink-0 rounded-lg border px-3 py-2.5 text-left transition",
        selected
          ? "border-primary bg-primary/15 shadow-[0_0_0_1px_hsl(var(--primary))]"
          : "border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5",
      ].join(" ")}
      aria-pressed={selected}
    >
      <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">{node.dayLabel}</span>
      <span className="mt-1 block text-sm font-semibold leading-snug text-foreground">{node.theme}</span>
    </button>
  );
}

function WeekColumn({
  label,
  nodes,
  selectedId,
  onSelect,
}: {
  label: string;
  nodes: RoadmapDayNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="roadmap-week-column flex shrink-0 flex-col items-center gap-0">
      <div className="mb-4 w-full max-w-[12rem] rounded-md border border-dashed border-border/70 bg-muted/40 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <div className="flex flex-col items-center">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col items-center">
            <RoadmapNode
              node={node}
              selected={selectedId === node.id}
              onSelect={() => onSelect(node.id)}
            />
            {index < nodes.length - 1 ? (
              <div className="roadmap-connector-v my-1 h-5 w-px bg-border" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MilestoneNode({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="flex w-[11.5rem] shrink-0 flex-col items-center">
      <div className="rounded-full border-2 border-primary bg-primary/10 px-4 py-3 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div className="flex shrink-0 items-center self-center px-2 pt-8" aria-hidden>
      <div className="h-px w-8 bg-border sm:w-12" />
      <div className="h-2 w-2 rotate-45 border-r border-t border-border" />
    </div>
  );
}

export function SprintRoadmapCanvas({ roadmap }: SprintRoadmapCanvasProps) {
  const allNodes = useMemo(() => [...roadmap.week1, ...roadmap.week2], [roadmap]);
  const [selectedId, setSelectedId] = useState<string | null>(roadmap.week1[0]?.id ?? null);

  const selectedNode = allNodes.find((n) => n.id === selectedId) ?? allNodes[0];

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="roadmap-canvas relative overflow-x-auto rounded-2xl border border-border/70 bg-[#fafafa] p-6 dark:bg-[#0c0c0c]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />

        <div className="relative flex min-w-max items-start gap-0 pb-2">
          <div className="flex shrink-0 flex-col items-center gap-4 pt-8">
            <MilestoneNode label="Start" sublabel="The promise" />
          </div>

          <HorizontalConnector />

          <WeekColumn
            label={roadmap.week1Label}
            nodes={roadmap.week1}
            selectedId={selectedId}
            onSelect={handleSelect}
          />

          <HorizontalConnector />

          <WeekColumn
            label={roadmap.week2Label}
            nodes={roadmap.week2}
            selectedId={selectedId}
            onSelect={handleSelect}
          />

          <HorizontalConnector />

          <div className="flex shrink-0 flex-col items-center gap-4 pt-8">
            <MilestoneNode label="Week 6" sublabel="Proof of work" />
            <div className="w-[11.5rem] space-y-2">
              {roadmap.proofArtifacts.map((artifact) => (
                <div
                  key={artifact.name}
                  className="rounded-md border border-border/60 bg-card/90 px-2.5 py-2 text-left"
                >
                  <p className="text-[11px] font-medium leading-snug text-foreground">{artifact.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{artifact.target}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedNode ? (
        <aside className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {selectedNode.dayLabel}
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">{selectedNode.theme}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Deliverable:</span> {selectedNode.deliverable}
          </p>
        </aside>
      ) : null}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-border/80 bg-card" />
          Day node — click for details
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-primary bg-primary/10" />
          Milestone
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-primary bg-primary/15" />
          Selected
        </span>
      </div>
    </div>
  );
}

"use client";

import { useCallback } from "react";
import { Check, MapPin } from "lucide-react";

import type { RoadmapDayNode, SprintRoadmapData } from "@/lib/sprint-roadmap-data";
import { cn } from "@/lib/utils";

type CollaborativeRoadmapPickerProps = {
  roadmap: SprintRoadmapData;
  markedNodeIds: string[];
  onMarkedNodeIdsChange: (ids: string[]) => void;
};

function PinnableRoadmapNode({
  node,
  pinned,
  onToggle,
}: {
  node: RoadmapDayNode;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative w-[11.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 touch-manipulation",
        pinned
          ? "scale-[1.02] border-[#2D6A4F] bg-[#2D6A4F]/12 shadow-[0_0_0_1px_#2D6A4F,0_8px_24px_-8px_rgba(45,106,79,0.35)]"
          : "border-border/80 bg-card/90 hover:border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/5",
      )}
      aria-pressed={pinned}
    >
      <span
        className={cn(
          "absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm transition-all duration-200",
          pinned
            ? "scale-100 border-[#2D6A4F] bg-[#2D6A4F] text-white opacity-100"
            : "scale-75 border-border/70 bg-background text-muted-foreground opacity-0 group-hover:scale-90 group-hover:opacity-100",
        )}
        aria-hidden
      >
        {pinned ? <Check className="size-3.5 stroke-[2.5]" /> : <MapPin className="size-3" />}
      </span>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
        {node.dayLabel}
      </span>
      <span className="mt-1 block text-sm font-semibold leading-snug text-foreground">{node.theme}</span>
    </button>
  );
}

function WeekColumn({
  label,
  nodes,
  markedNodeIds,
  onToggle,
}: {
  label: string;
  nodes: RoadmapDayNode[];
  markedNodeIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0">
      <div className="mb-4 w-full max-w-[12rem] rounded-xl border border-dashed border-[#2D6A4F]/25 bg-[#2D6A4F]/5 px-3 py-2 text-center backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]/80">{label}</p>
      </div>
      <div className="flex flex-col items-center">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col items-center">
            <PinnableRoadmapNode
              node={node}
              pinned={markedNodeIds.includes(node.id)}
              onToggle={() => onToggle(node.id)}
            />
            {index < nodes.length - 1 ? (
              <div className="my-1 h-5 w-px bg-border/80" aria-hidden />
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
      <div className="rounded-full border-2 border-[#2D6A4F]/60 bg-[#2D6A4F]/8 px-4 py-3 text-center">
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

export function CollaborativeRoadmapPicker({
  roadmap,
  markedNodeIds,
  onMarkedNodeIdsChange,
}: CollaborativeRoadmapPickerProps) {
  const handleToggle = useCallback(
    (id: string) => {
      if (markedNodeIds.includes(id)) {
        onMarkedNodeIdsChange(markedNodeIds.filter((nodeId) => nodeId !== id));
        return;
      }
      onMarkedNodeIdsChange([...markedNodeIds, id]);
    },
    [markedNodeIds, onMarkedNodeIdsChange],
  );

  return (
    <div className="space-y-3">
      <div className="relative overflow-x-auto rounded-2xl border border-[#2D6A4F]/15 bg-gradient-to-br from-[#FDFBF7]/90 via-card/80 to-[#D4A574]/10 p-4 backdrop-blur-sm sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, #2D6A4F22 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden
        />

        <div className="relative flex min-w-max items-start gap-0 pb-1">
          <div className="flex shrink-0 flex-col items-center gap-4 pt-8">
            <MilestoneNode label="Start" sublabel="The promise" />
          </div>

          <HorizontalConnector />

          <WeekColumn
            label={roadmap.week1Label}
            nodes={roadmap.week1}
            markedNodeIds={markedNodeIds}
            onToggle={handleToggle}
          />

          <HorizontalConnector />

          <WeekColumn
            label={roadmap.week2Label}
            nodes={roadmap.week2}
            markedNodeIds={markedNodeIds}
            onToggle={handleToggle}
          />

          <HorizontalConnector />

          <div className="flex shrink-0 flex-col items-center gap-4 pt-8">
            <MilestoneNode label="Week 6" sublabel="Proof of work" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tap days to pin priority areas — DearCC will co-build your sprint around these.
      </p>
    </div>
  );
}

export function getMarkedNodeThemes(
  roadmap: SprintRoadmapData,
  markedNodeIds: string[],
): string[] {
  const allNodes = [...roadmap.week1, ...roadmap.week2];
  return markedNodeIds
    .map((id) => allNodes.find((node) => node.id === id))
    .filter((node): node is RoadmapDayNode => Boolean(node))
    .map((node) => `${node.dayLabel}: ${node.theme}`);
}

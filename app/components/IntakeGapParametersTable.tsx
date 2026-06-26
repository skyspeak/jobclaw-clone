"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import {
  coerceGapParameters,
  splitGapParametersToBars,
  type GapSkillBar,
  type ProfileGapParameter,
} from "@/lib/profile-gaps";
import { cn } from "@/lib/utils";

type IntakeGapParametersTableProps = {
  parameters: ProfileGapParameter[];
  targetLabel?: string;
};

function GapSkillBarRow({ item, variant }: { item: GapSkillBar; variant: "strength" | "gap" }) {
  const barColor = variant === "strength" ? "bg-[#2D6A4F]" : "bg-[#C05621]";
  const tierColor = variant === "strength" ? "text-[#2D6A4F]" : "text-[#C05621]";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <span className={cn("shrink-0 text-xs font-semibold", tierColor)}>{item.tier}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#EFEBE0]">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${item.score}%` }}
        />
      </div>
      {item.keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.keywords.map((keyword) => (
            <span
              key={keyword}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                variant === "strength"
                  ? "border-[#2D6A4F]/30 bg-[#2D6A4F]/8 text-[#2D6A4F]"
                  : "border-[#C05621]/30 bg-[#C05621]/8 text-[#C05621]",
              )}
            >
              {keyword}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function IntakeGapParametersTable({
  parameters,
  targetLabel,
}: IntakeGapParametersTableProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const rows = coerceGapParameters(parameters);
  const { strengths, gaps } = splitGapParametersToBars(rows);

  async function handleDownloadImage() {
    if (!captureRef.current || rows.length === 0) {
      return;
    }

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FDFBF7",
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `dearcc-gap-analysis-${new Date().toISOString().slice(0, 10)}.png`;
      anchor.click();
    } catch {
      // silent — user can retry
    } finally {
      setIsDownloading(false);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Upload a résumé or linkedin to see a detailed gap breakdown.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={captureRef}
        className="overflow-hidden rounded-2xl border border-border/70 bg-[#FDFBF7] p-6 sm:p-8"
      >
        {targetLabel ? (
          <p className="mb-6 text-xs text-muted-foreground">
            Target: <span className="font-medium text-foreground">{targetLabel}</span>
          </p>
        ) : null}

        <div className="space-y-8">
          {strengths.length > 0 ? (
            <div className="space-y-5">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                What you already bring
              </h2>
              {strengths.map((item) => (
                <GapSkillBarRow key={item.label} item={item} variant="strength" />
              ))}
            </div>
          ) : null}

          {gaps.length > 0 ? (
            <div
              className={cn(
                "space-y-5",
                strengths.length > 0 && "border-t border-border/60 pt-8",
              )}
            >
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                What the role needed that did not show up
              </h2>
              {gaps.map((item) => (
                <GapSkillBarRow key={item.label} item={item} variant="gap" />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={isDownloading}
        onClick={() => void handleDownloadImage()}
      >
        <Download className="mr-2 h-4 w-4" />
        {isDownloading ? "Preparing image…" : "Download as image"}
      </Button>
    </div>
  );
}

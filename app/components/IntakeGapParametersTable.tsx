"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { coerceGapParameters, gapStatusLabel, type ProfileGapParameter } from "@/lib/profile-gaps";
import { cn } from "@/lib/utils";

type IntakeGapParametersTableProps = {
  parameters: ProfileGapParameter[];
  targetLabel?: string;
};

export function IntakeGapParametersTable({
  parameters,
  targetLabel,
}: IntakeGapParametersTableProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const rows = coerceGapParameters(parameters);

  async function handleDownloadImage() {
    if (!captureRef.current || rows.length === 0) {
      return;
    }

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
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
      <div ref={captureRef} className="overflow-hidden rounded-xl border border-border/70 bg-white p-4">
        <div className="mb-3 border-b border-border/60 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            dear[CC] · profile gap analysis
          </p>
          {targetLabel ? (
            <p className="mt-1 text-sm font-medium text-foreground">Target: {targetLabel}</p>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40">
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Facet
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Job requires
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  You have
                </th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verdict
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.parameter} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-3 align-top font-semibold text-foreground">{row.parameter}</td>
                  <td className="px-3 py-3 align-top text-foreground">{row.jobRequires}</td>
                  <td className="px-3 py-3 align-top text-foreground">{row.youHave}</td>
                  <td className="px-3 py-3 align-top">
                    <span
                      className={cn(
                        "inline-block rounded-md bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white",
                      )}
                      role="status"
                      aria-label={`Verdict: ${gapStatusLabel(row.status)}`}
                    >
                      {gapStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

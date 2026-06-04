import type { ProfileGapParameter } from "@/lib/profile-gaps";
import { gapStatusLabel } from "@/lib/profile-gaps";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ProfileGapParameter["status"], string> = {
  missing: "border-red-500/40 bg-red-500/10 text-red-200",
  good: "border-[#93A300]/50 bg-[#93A300]/15 text-[#d4e86a]",
  stretch: "border-amber-500/40 bg-amber-500/10 text-amber-100",
};

export function IntakeGapParametersTable({ parameters }: { parameters: ProfileGapParameter[] }) {
  if (parameters.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Upload a résumé or linkedin to see a detailed gap breakdown.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-muted/40">
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Facet
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((row) => (
            <tr key={row.parameter} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-3 align-top font-medium text-foreground">{row.parameter}</td>
              <td className="px-3 py-3 align-top">
                <span
                  className={cn(
                    "inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    STATUS_STYLES[row.status],
                  )}
                >
                  {gapStatusLabel(row.status)}
                </span>
              </td>
              <td className="px-3 py-3 align-top text-muted-foreground">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

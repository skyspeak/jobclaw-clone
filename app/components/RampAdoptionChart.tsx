import { rampAiAdoptionData, rampAiAdoptionSeries } from "@/lib/rampAdoptionData";

const chart = {
  width: 920,
  height: 460,
  padding: { top: 24, right: 28, bottom: 54, left: 58 },
};

const maxValue = 80;
const minValue = 0;

type SeriesKey = (typeof rampAiAdoptionSeries)[number]["key"];

export function RampAdoptionChart() {
  const latest = rampAiAdoptionData.at(-1);
  const first = rampAiAdoptionData[0];

  return (
    <section className="space-y-8 rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10" aria-labelledby="adoption-title">
      <div className="flex flex-wrap items-end justify-between gap-6 md:gap-12">
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            AI adoption
          </p>
          <h1 id="adoption-title" className="max-w-xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.2rem,5vw,3.5rem)]">
            AI use is moving from experiment to default workflow.
          </h1>
          <p className="max-w-xl pt-5 text-[1.05rem] leading-relaxed text-muted-foreground">
            Monthly share of businesses using AI by sector. Source: Ramp data provided in the workspace.
          </p>
        </div>
        {latest ? (
          <div aria-live="polite" className="grid shrink-0 justify-items-end tabular-nums text-foreground">
            <span className="max-w-[9rem] text-right text-[0.72rem] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground md:max-w-none md:text-[0.8rem]">
              Latest average
            </span>
            <strong className="leading-[0.92] md:text-[clamp(3rem,8vw,4.5rem)]">
              {latest.average.toFixed(1)}%
            </strong>
            <span className="max-w-[9rem] text-right text-[0.72rem] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground md:max-w-none md:text-[0.8rem]">
              {formatMonth(latest.date)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card p-4">
        <svg
          aria-label="Time series chart of AI adoption by sector"
          className="block min-h-[340px] w-full min-w-[760px] text-muted-foreground"
          role="img"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
        >
          <line
            className="stroke-foreground stroke-[1.5]"
            x1={chart.padding.left}
            x2={chart.width - chart.padding.right}
            y1={chart.height - chart.padding.bottom}
            y2={chart.height - chart.padding.bottom}
          />
          <line
            className="stroke-foreground stroke-[1.5]"
            x1={chart.padding.left}
            x2={chart.padding.left}
            y1={chart.padding.top}
            y2={chart.height - chart.padding.bottom}
          />

          {[0, 20, 40, 60, 80].map((tick) => (
            <g key={tick}>
              <line
                className="stroke-border"
                strokeWidth={1}
                x1={chart.padding.left}
                x2={chart.width - chart.padding.right}
                y1={scaleY(tick)}
                y2={scaleY(tick)}
              />
              <text fill="currentColor" className="text-xs opacity-70" x={chart.padding.left - 14} y={scaleY(tick) + 4}>
                {tick}%
              </text>
            </g>
          ))}

          {rampAiAdoptionData
            .filter((_, index) => index % 6 === 0 || index === rampAiAdoptionData.length - 1)
            .map((point, index, ticks) => (
              <text
                fill="currentColor"
                className="text-xs opacity-70"
                key={point.date}
                textAnchor={index === ticks.length - 1 ? "end" : "middle"}
                x={scaleX(rampAiAdoptionData.findIndex((item) => item.date === point.date))}
                y={chart.height - 20}
              >
                {point.date}
              </text>
            ))}

          {rampAiAdoptionSeries.map((series) => (
            <g key={series.key}>
              <path
                d={buildPath(series.key)}
                fill="none"
                stroke={series.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={series.key === "average" ? 4 : 3}
              />
              <circle
                cx={scaleX(rampAiAdoptionData.length - 1)}
                cy={scaleY(latest?.[series.key] ?? 0)}
                fill={series.color}
                r={4}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {rampAiAdoptionSeries.map((series) => {
          const start = first?.[series.key] ?? 0;
          const end = latest?.[series.key] ?? 0;

          return (
            <div
              key={series.key}
              className="rounded-[18px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <span className="mb-4 block h-1 w-8 rounded-full" style={{ background: series.color }} />
              <strong className="mb-3 block leading-tight text-foreground">{series.label}</strong>
              <p className="m-0 text-sm leading-snug text-muted-foreground">
                {start.toFixed(1)}% to {end.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      <p className="m-0 text-sm leading-snug text-muted-foreground">
        Source: Ramp AI adoption data. Sector average calculated from the Ramp NAICS sector series saved in{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">data/ramp-ai-adoption-by-sector.csv</code>.
      </p>
    </section>
  );
}

function buildPath(key: SeriesKey) {
  return rampAiAdoptionData
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${scaleX(index).toFixed(2)} ${scaleY(point[key]).toFixed(2)}`;
    })
    .join(" ");
}

function scaleX(index: number) {
  const drawableWidth = chart.width - chart.padding.left - chart.padding.right;
  return chart.padding.left + (index / (rampAiAdoptionData.length - 1)) * drawableWidth;
}

function scaleY(value: number) {
  const drawableHeight = chart.height - chart.padding.top - chart.padding.bottom;
  const ratio = (value - minValue) / (maxValue - minValue);
  return chart.height - chart.padding.bottom - ratio * drawableHeight;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}

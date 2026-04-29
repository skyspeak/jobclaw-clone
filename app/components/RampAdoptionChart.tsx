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
    <section className="card adoption-card" aria-labelledby="adoption-title">
      <div className="adoption-hero">
        <div>
          <p className="eyebrow">AI adoption</p>
          <h1 id="adoption-title">AI use is moving from experiment to default workflow.</h1>
          <p className="lead">
            Monthly share of businesses using AI by sector. Source: Ramp data
            provided in the workspace.
          </p>
        </div>
        {latest ? (
          <div className="adoption-stat">
            <span>Latest average</span>
            <strong>{latest.average.toFixed(1)}%</strong>
            <span>{formatMonth(latest.date)}</span>
          </div>
        ) : null}
      </div>

      <div className="chart-wrap">
        <svg
          aria-label="Time series chart of AI adoption by sector"
          className="adoption-chart"
          role="img"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
        >
          <line
            className="axis"
            x1={chart.padding.left}
            x2={chart.width - chart.padding.right}
            y1={chart.height - chart.padding.bottom}
            y2={chart.height - chart.padding.bottom}
          />
          <line
            className="axis"
            x1={chart.padding.left}
            x2={chart.padding.left}
            y1={chart.padding.top}
            y2={chart.height - chart.padding.bottom}
          />

          {[0, 20, 40, 60, 80].map((tick) => (
            <g key={tick}>
              <line
                className="grid-line"
                x1={chart.padding.left}
                x2={chart.width - chart.padding.right}
                y1={scaleY(tick)}
                y2={scaleY(tick)}
              />
              <text className="axis-label" x={chart.padding.left - 14} y={scaleY(tick) + 4}>
                {tick}%
              </text>
            </g>
          ))}

          {rampAiAdoptionData
            .filter((_, index) => index % 6 === 0 || index === rampAiAdoptionData.length - 1)
            .map((point, index, ticks) => (
              <text
                className="axis-label"
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

      <div className="legend-grid">
        {rampAiAdoptionSeries.map((series) => {
          const start = first?.[series.key] ?? 0;
          const end = latest?.[series.key] ?? 0;

          return (
            <div className="legend-card" key={series.key}>
              <span style={{ background: series.color }} />
              <strong>{series.label}</strong>
              <p>
                {start.toFixed(1)}% to {end.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      <p className="source-note">
        Source: Ramp AI adoption data. Sector average calculated from the Ramp
        NAICS sector series saved in `data/ramp-ai-adoption-by-sector.csv`.
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

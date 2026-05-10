"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Direction = "across" | "down";

type CrosswordWord = {
  id: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
};

type Cell = {
  row: number;
  col: number;
  letter: string;
  number?: number;
};

const words: CrosswordWord[] = [
  {
    id: 1,
    answer: "TRANSFORMER",
    clue: "Architecture that powers many modern language models by attending to context.",
    row: 5,
    col: 1,
    direction: "across",
  },
  {
    id: 2,
    answer: "TOKEN",
    clue: "A chunk of text a model reads or predicts.",
    row: 5,
    col: 1,
    direction: "down",
  },
  {
    id: 3,
    answer: "AGENT",
    clue: "A system that can plan, use tools, and take actions toward a goal.",
    row: 5,
    col: 3,
    direction: "down",
  },
  {
    id: 4,
    answer: "NEURAL",
    clue: "Describes a network inspired by connected processing units.",
    row: 2,
    col: 8,
    direction: "down",
  },
  {
    id: 5,
    answer: "LAYER",
    clue: "A stacked processing stage inside a neural network.",
    row: 2,
    col: 10,
    direction: "down",
  },
];

const solvedGrid = buildSolvedGrid();
const playableCells = Array.from(solvedGrid.values());

export function AiCompetenceCrossword() {
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const score = useMemo(() => {
    const correct = playableCells.filter((cell) => entries[cellKey(cell.row, cell.col)] === cell.letter).length;
    return {
      correct,
      total: playableCells.length,
      complete: correct === playableCells.length,
    };
  }, [entries]);

  const displayedSeconds = score.complete ? Math.max(1, elapsedSeconds) : elapsedSeconds;
  const formattedTime = formatTime(displayedSeconds);
  const shareText = score.complete
    ? `I solved the AI Competence Crossword in ${formattedTime}. Try TOKEN, LAYER, NEURAL, TRANSFORMER, and AGENT.`
    : `I scored ${score.correct}/${score.total} in ${formattedTime} on the AI Competence Crossword. Try TOKEN, LAYER, NEURAL, TRANSFORMER, and AGENT.`;
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const sharePayload = `${shareText} ${shareUrl}`.trim();
  const xUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({
    text: shareText,
    url: shareUrl,
  }).toString()}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({
    url: shareUrl,
  }).toString()}`;

  useEffect(() => {
    if (!hasStarted || score.complete) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasStarted, score.complete]);

  function updateCell(row: number, col: number, event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);

    if (!hasStarted) {
      setHasStarted(true);
    }

    setChecked(false);
    setEntries((current) => ({
      ...current,
      [cellKey(row, col)]: value,
    }));
  }

  function resetGame() {
    setEntries({});
    setChecked(false);
    setCopied(false);
    setHasStarted(false);
    setElapsedSeconds(0);
  }

  function revealGame() {
    if (!hasStarted) {
      setHasStarted(true);
      setElapsedSeconds(1);
    }

    const revealed = Object.fromEntries(
      playableCells.map((cell) => [cellKey(cell.row, cell.col), cell.letter]),
    );

    setEntries(revealed);
    setChecked(true);
  }

  async function shareGame() {
    setCopied(false);

    if (navigator.share) {
      await navigator.share({
        title: "AI Competence Crossword",
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(sharePayload);
    setCopied(true);
  }

  return (
    <section className="space-y-8 rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10" aria-labelledby="crossword-title">
      <div className="flex flex-wrap items-end justify-between gap-6 lg:gap-10">
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            AI competence crossword
          </p>
          <h1 id="crossword-title" className="max-w-lg text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.3rem,6vw,3.4rem)]">
            Five words. One tiny model literacy check.
          </h1>
          <p className="max-w-lg pt-4 text-[1.05rem] leading-relaxed text-muted-foreground">
            Fill the grid, check your answers, then share your score as a small game mechanic.
          </p>
        </div>
        <div aria-live="polite" className="grid shrink-0 justify-items-end tabular-nums text-foreground">
          <span className="max-w-[8rem] text-right text-[0.72rem] font-bold uppercase leading-tight tracking-[0.12em] text-muted-foreground md:text-[0.8rem]">
            {score.complete ? "Finished" : "Timer"}
          </span>
          <strong className="leading-[0.92] md:text-[clamp(4rem,11vw,6.5rem)]">{formattedTime}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(320px,0.92fr)_minmax(280px,0.82fr)] lg:gap-10">
        <div className="grid w-full gap-2 [grid-template-columns:repeat(13,minmax(24px,1fr))] [grid-template-rows:repeat(13,minmax(24px,1fr))] lg:aspect-square lg:max-w-[620px] md:justify-self-start" aria-label="AI competence crossword grid">
          {playableCells.map((cell) => {
            const value = entries[cellKey(cell.row, cell.col)] ?? "";
            const isWrong = checked && value !== cell.letter;

            return (
              <label
                className={cn(
                  "relative grid aspect-square place-items-center rounded-lg border bg-card md:gap-px",
                  isWrong
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-foreground",
                )}
                key={`${cell.row}-${cell.col}`}
                style={{
                  gridColumn: cell.col + 1,
                  gridRow: cell.row + 1,
                }}
              >
                {cell.number ? (
                  <span className="absolute left-2 top-[3px] text-[10px] font-medium leading-none text-muted-foreground">
                    {cell.number}
                  </span>
                ) : null}
                <input
                  className="flex h-[calc(100%-2px)] w-[calc(100%-2px)] items-center justify-center rounded-[7px] border-0 bg-transparent p-0 text-center font-extrabold uppercase text-current outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ fontSize: "clamp(1rem, 2vw, 1.55rem)" }}
                  aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}`}
                  maxLength={1}
                  value={value}
                  onChange={(event) => updateCell(cell.row, cell.col, event)}
                />
              </label>
            );
          })}
        </div>

        <div className="grid gap-6">
          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">Across</h2>
            <ol className="m-0 list-decimal space-y-3 px-8 text-muted-foreground">
              {words
                .filter((word) => word.direction === "across")
                .map((word) => (
                  <li key={word.id} className="leading-relaxed [&>strong]:font-semibold [&>strong]:text-foreground">
                    <strong>{word.id}.</strong> {word.clue}
                  </li>
                ))}
            </ol>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold tracking-tight">Down</h2>
            <ol className="m-0 list-decimal space-y-3 px-8 text-muted-foreground">
              {words
                .filter((word) => word.direction === "down")
                .map((word) => (
                  <li key={word.id} className="leading-relaxed [&>strong]:font-semibold [&>strong]:text-foreground">
                    <strong>{word.id}.</strong> {word.clue}
                  </li>
                ))}
            </ol>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button className="rounded-2xl cta-glow" type="button" onClick={() => setChecked(true)}>
              Check answers
            </Button>
            <Button variant="outline" type="button" className="rounded-2xl" onClick={revealGame}>
              Reveal
            </Button>
            <Button variant="outline" type="button" className="rounded-2xl" onClick={resetGame}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Share your time and invite your friends</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Native share opens the mobile share sheet. X and LinkedIn links are web fallbacks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-2xl cta-glow" type="button" onClick={shareGame}>
            Share score
          </Button>
          <Button variant="outline" asChild className="rounded-2xl">
            <a href={xUrl} rel="noreferrer" target="_blank">
              Share on X
            </a>
          </Button>
          <Button variant="outline" asChild className="rounded-2xl">
            <a href={linkedInUrl} rel="noreferrer" target="_blank">
              Share on LinkedIn
            </a>
          </Button>
        </div>
        {copied ? (
          <p className="w-full text-sm text-muted-foreground md:w-auto">Share text copied to clipboard.</p>
        ) : null}
      </div>
    </section>
  );
}

function buildSolvedGrid() {
  const cells = new Map<string, Cell>();

  for (const word of words) {
    [...word.answer].forEach((letter, index) => {
      const row = word.direction === "across" ? word.row : word.row + index;
      const col = word.direction === "across" ? word.col + index : word.col;
      const key = cellKey(row, col);
      const existing = cells.get(key);

      cells.set(key, {
        row,
        col,
        letter,
        number: existing?.number ?? (index === 0 ? word.id : undefined),
      });
    });
  }

  return cells;
}

function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

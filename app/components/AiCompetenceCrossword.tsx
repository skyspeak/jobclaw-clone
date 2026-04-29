"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

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
    <section className="card crossword-card" aria-labelledby="crossword-title">
      <div className="crossword-hero">
        <div>
          <p className="eyebrow">AI competence crossword</p>
          <h1 id="crossword-title">Five words. One tiny model literacy check.</h1>
          <p className="lead">
            Fill the grid, check your answers, then share your score as a small game mechanic.
          </p>
        </div>
        <div className="timer-card" aria-live="polite">
          <span>{score.complete ? "Finished" : "Timer"}</span>
          <strong>{formattedTime}</strong>
        </div>
      </div>

      <div className="crossword-layout">
        <div className="crossword-grid" aria-label="AI competence crossword grid">
          {playableCells.map((cell) => {
            const value = entries[cellKey(cell.row, cell.col)] ?? "";
            const isWrong = checked && value !== cell.letter;

            return (
              <label
                className={`crossword-cell ${isWrong ? "wrong" : ""}`}
                key={`${cell.row}-${cell.col}`}
                style={{
                  gridColumn: cell.col + 1,
                  gridRow: cell.row + 1,
                }}
              >
                {cell.number ? <span>{cell.number}</span> : null}
                <input
                  aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}`}
                  maxLength={1}
                  value={value}
                  onChange={(event) => updateCell(cell.row, cell.col, event)}
                />
              </label>
            );
          })}
        </div>

        <div className="clue-panel">
          <section>
            <h2>Across</h2>
            <ol className="clue-list">
              {words
                .filter((word) => word.direction === "across")
                .map((word) => (
                  <li key={word.id}>
                    <strong>{word.id}.</strong> {word.clue}
                  </li>
                ))}
            </ol>
          </section>

          <section>
            <h2>Down</h2>
            <ol className="clue-list">
              {words
                .filter((word) => word.direction === "down")
                .map((word) => (
                  <li key={word.id}>
                    <strong>{word.id}.</strong> {word.clue}
                  </li>
                ))}
            </ol>
          </section>

          <div className="actions">
            <button className="button" type="button" onClick={() => setChecked(true)}>
              Check answers
            </button>
            <button className="button secondary" type="button" onClick={revealGame}>
              Reveal
            </button>
            <button className="button secondary" type="button" onClick={resetGame}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="share-panel">
        <div>
          <h2>Share your time and invite your friends</h2>
          <p className="muted">
            Native share opens the mobile share sheet. X and LinkedIn links are web fallbacks.
          </p>
        </div>
        <div className="actions">
          <button className="button" type="button" onClick={shareGame}>
            Share score
          </button>
          <a className="button secondary" href={xUrl} rel="noreferrer" target="_blank">
            Share on X
          </a>
          <a className="button secondary" href={linkedInUrl} rel="noreferrer" target="_blank">
            Share on LinkedIn
          </a>
        </div>
        {copied ? <p className="muted">Share text copied to clipboard.</p> : null}
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

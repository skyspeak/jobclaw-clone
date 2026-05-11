"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const LOADING_MESSAGES = [
  "Analyzing your answers...",
  "Understanding what drives you...",
  "Mapping your strengths to opportunities...",
  "Crafting your career brief...",
  "Almost there — putting it all together...",
];

export function IntakeGeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      timeoutId = setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center brand-bg"
      data-testid="loading-screen"
    >
      <div className="flex max-w-sm flex-col items-center gap-8 px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/40 blur-2xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg">
            <Loader2 className="h-9 w-9 animate-spin text-foreground" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <p
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
          >
            {LOADING_MESSAGES[msgIndex]}
          </p>
          <p className="text-sm text-muted-foreground">This usually takes 10–20 seconds.</p>
        </div>

        <div className="mt-2 flex gap-1.5">
          {LOADING_MESSAGES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === msgIndex ? "24px" : "6px",
                backgroundColor:
                  i === msgIndex ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

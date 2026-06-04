"use client";

import { useEffect, useState } from "react";

import { Chat } from "@/app/components/lead-gen/Chat";

export function LeadGenHome() {
  const [started, setStarted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  if (started) {
    return <Chat />;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0a] px-6 text-[#f0f0f0]">
      <div
        className={[
          "max-w-md text-center transition-opacity duration-700",
          heroVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <p className="text-lg leading-relaxed sm:text-xl">dear[CC] helps you get your first job</p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-8 rounded-xl border border-[#2a2a2a] px-6 py-3 text-sm transition hover:border-[#e8ff47]"
        >
          get started
        </button>
      </div>
    </main>
  );
}

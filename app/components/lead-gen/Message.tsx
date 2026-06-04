"use client";

import { useEffect, useRef, useState } from "react";

type MessageProps = {
  role: "bot" | "user";
  text: string;
  animate?: boolean;
  onTyped?: () => void;
};

export function Message({ role, text, animate = false, onTyped }: MessageProps) {
  const onTypedRef = useRef(onTyped);
  onTypedRef.current = onTyped;

  const shouldType = role === "bot" && animate;
  const typingDoneRef = useRef(!shouldType);
  const [displayed, setDisplayed] = useState(shouldType ? "" : text);
  const [userEntered, setUserEntered] = useState(false);

  useEffect(() => {
    if (role === "user") {
      const frame = requestAnimationFrame(() => setUserEntered(true));
      return () => cancelAnimationFrame(frame);
    }

    if (typingDoneRef.current) {
      setDisplayed(text);
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        typingDoneRef.current = true;
        onTypedRef.current?.();
      }
    }, 30);

    return () => window.clearInterval(timer);
    // Run typing animation once per mounted message; text is stable per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, text]);

  if (role === "bot") {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#555555]">
          dear[CC]
        </span>
        <div className="max-w-[85%] rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm leading-relaxed text-[#f0f0f0]">
          {displayed}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className={[
          "max-w-[85%] rounded-2xl bg-[#e8ff47] px-4 py-3 text-sm leading-relaxed text-[#0a0a0a]",
          userEntered ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0",
        ].join(" ")}
        style={{ transition: "transform 150ms ease-out, opacity 150ms ease-out" }}
      >
        {text}
      </div>
    </div>
  );
}

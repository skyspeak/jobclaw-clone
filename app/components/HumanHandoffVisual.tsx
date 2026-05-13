"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DoorOpen, UserRound, Users } from "lucide-react";

import { cn } from "@/lib/utils";

/** Left connector: your story → people who guide */
const PATH_TO_GUIDES = "M 8 50 Q 48 14, 92 48";

/** Right connector: guides → the next opening */
const PATH_TO_OPPORTUNITY = "M 8 48 Q 50 20, 92 44";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function HumanHandoffVisual({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <figure
      className={cn("w-full max-w-xl", className)}
      aria-labelledby="journey-guided-opportunities-title"
    >
      <figcaption id="journey-guided-opportunities-title" className="sr-only">
        A short journey from you to people who guide you, then onward to a new opportunity. The motion
        is a metaphor for humans helping humans—not software acting on its own.
      </figcaption>

      <div className="flex min-w-[18.5rem] items-end justify-center gap-x-0.5 overflow-x-auto px-0.5 pb-0.5 sm:min-w-0 sm:gap-x-1 sm:overflow-visible sm:px-0">
        <JourneyNode
          label="You"
          sub="Where you are"
          icon={<UserRound className="size-[1.65rem] text-primary sm:size-7" strokeWidth={1.75} />}
          motionRole="you"
          reducedMotion={reducedMotion}
        />

        <JourneySegment
          path={PATH_TO_GUIDES}
          reducedMotion={reducedMotion}
          motionDuration="3.6s"
          motionBegin="0s"
        />

        <JourneyNode
          label="Guides"
          sub="People who steer"
          icon={<Users className="size-[1.65rem] text-primary sm:size-7" strokeWidth={1.75} />}
          motionRole="guides"
          reducedMotion={reducedMotion}
        />

        <JourneySegment
          path={PATH_TO_OPPORTUNITY}
          reducedMotion={reducedMotion}
          motionDuration="3.6s"
          motionBegin="1.85s"
        />

        <JourneyNode
          label="Openings"
          sub="What’s next"
          icon={<DoorOpen className="size-[1.65rem] text-primary sm:size-7" strokeWidth={1.75} />}
          motionRole="opportunity"
          reducedMotion={reducedMotion}
        />
      </div>

      <p
        className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]"
        aria-hidden
      >
        People guide you toward real opportunities
      </p>
    </figure>
  );
}

function JourneySegment({
  path,
  reducedMotion,
  motionDuration,
  motionBegin,
}: {
  path: string;
  reducedMotion: boolean;
  motionDuration: string;
  motionBegin: string;
}) {
  return (
    <div className="relative flex h-[5.5rem] min-w-[2.25rem] flex-1 max-w-[5.5rem] items-center sm:h-[6rem] sm:min-w-[2.75rem] sm:max-w-none">
      <svg
        className="human-handoff-svg h-full w-full overflow-visible text-primary"
        viewBox="0 0 100 88"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={path}
          className={cn(
            "human-handoff-path fill-none stroke-current stroke-[2.1] opacity-[0.36] sm:stroke-[2.35]",
            !reducedMotion && "human-handoff-path--flow",
          )}
          pathLength={100}
        />
        {!reducedMotion ? (
          <>
            <circle r="4.5" className="fill-primary" opacity={0.92}>
              <animateMotion
                dur={motionDuration}
                begin={motionBegin}
                repeatCount="indefinite"
                rotate="auto"
                path={path}
              />
            </circle>
            <circle r="2.75" className="fill-primary" opacity={0.32}>
              <animateMotion
                dur={motionDuration}
                begin={`${parseFloat(motionBegin) + 0.55}s`}
                repeatCount="indefinite"
                rotate="auto"
                path={path}
              />
            </circle>
          </>
        ) : (
          <circle cx="50" cy="46" r="3.5" className="fill-primary/80" opacity={0.85} />
        )}
      </svg>
    </div>
  );
}

function JourneyNode({
  label,
  sub,
  icon,
  motionRole,
  reducedMotion,
}: {
  label: string;
  sub: string;
  icon: ReactNode;
  motionRole: "you" | "guides" | "opportunity";
  reducedMotion: boolean;
}) {
  const motionClass =
    !reducedMotion &&
    (motionRole === "you"
      ? "human-handoff-node human-handoff-node--a"
      : motionRole === "guides"
        ? "human-handoff-node human-handoff-node--guide"
        : "human-handoff-node human-handoff-node--b");

  return (
    <div
      className={cn(
        "flex w-[4.1rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5.1rem] sm:gap-2",
        motionClass,
      )}
    >
      <div
        className={cn(
          "relative flex size-[3.35rem] items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-primary/10 sm:size-[3.85rem]",
          motionRole === "guides" && "ring-2 ring-primary/20 sm:size-16",
        )}
      >
        {icon}
      </div>
      <div className="text-center">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
          {label}
        </p>
        <p className="text-[9px] leading-snug text-muted-foreground sm:text-[10px]">{sub}</p>
      </div>
    </div>
  );
}

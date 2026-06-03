import { AI_PROJECT_SPRINTS, AI_TRACKS, type AiTrack } from "@/lib/ai-tracks-data";

export const TRACK_COMMIT_WINDOW_DAYS = 14;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function formatTrackDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTrackById(trackId: string): AiTrack | undefined {
  const normalized =
    trackId === "ai-marketer"
      ? "marketing"
      : trackId === "engineering" || trackId === "swe"
        ? undefined
        : trackId === "forward-deployed-engineer"
          ? "forward-deployed-engineer"
          : trackId;
  if (!normalized) {
    return undefined;
  }
  return [...AI_TRACKS, ...AI_PROJECT_SPRINTS].find(
    (track) => track.id === normalized || track.slug === normalized,
  );
}

export type TrackCommitCalendar = {
  url: string;
  startDate: Date;
  finishDate: Date;
  startLabel: string;
  finishLabel: string;
};

/** All-day Google Calendar event spanning today through the two-week finish date. */
export function buildTrackCommitCalendarUrl(
  track: AiTrack,
  committedAt: Date = new Date(),
): TrackCommitCalendar {
  const startDate = startOfDay(committedAt);
  const finishDate = startOfDay(addDays(startDate, TRACK_COMMIT_WINDOW_DAYS));
  const endExclusive = addDays(finishDate, 1);

  const text = `dear[CC]: ${track.title} — 2-week track`;
  const details = [
    `Track ${track.number}: ${track.subtitle}`,
    "",
    "You committed to a two-week AI track through dear[CC].",
    `Start: ${formatTrackDate(startDate)}`,
    `Finish line: ${formatTrackDate(finishDate)}`,
    "",
    track.bet,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${formatYmd(startDate)}/${formatYmd(endExclusive)}`,
    details,
  });

  return {
    url: `https://calendar.google.com/calendar/render?${params.toString()}`,
    startDate,
    finishDate,
    startLabel: formatTrackDate(startDate),
    finishLabel: formatTrackDate(finishDate),
  };
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 200) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

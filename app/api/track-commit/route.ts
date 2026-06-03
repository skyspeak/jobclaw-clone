import { NextResponse } from "next/server";

import {
  buildTrackCommitCalendarUrl,
  getTrackById,
  isValidEmail,
  isValidPhone,
} from "@/lib/ai-tracks-commit";
import { createTrackCommit, trackCommitRequestSchema } from "@/lib/track-commits";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = trackCommitRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid commit payload." }, { status: 400 });
  }

  const track = getTrackById(parsed.data.trackId);

  if (!track || track.title !== parsed.data.trackTitle) {
    return NextResponse.json({ error: "Unknown track." }, { status: 400 });
  }

  if (!isValidEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isValidPhone(parsed.data.phone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number (at least 10 digits)." },
      { status: 400 },
    );
  }

  const calendar = buildTrackCommitCalendarUrl(track);

  const record = await createTrackCommit({
    ...parsed.data,
    finishDate: calendar.finishDate.toISOString(),
  });

  return NextResponse.json({
    commit: record,
    calendarUrl: calendar.url,
    finishLabel: calendar.finishLabel,
    startLabel: calendar.startLabel,
  });
}

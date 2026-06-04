import { NextResponse } from "next/server";

import {
  buildTrackCommitCalendarUrl,
  getTrackById,
  isValidEmail,
  isValidPhone,
} from "@/lib/ai-tracks-commit";
import { aiTrackToPairingTrack } from "@/lib/pairing/constants";
import { registerPairingUser } from "@/lib/pairing/store";
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

  const pairingTrack = aiTrackToPairingTrack(track);
  let cohort: {
    userId: string;
    status: string;
    groupId: string | null;
    track: string;
  } | null = null;

  if (pairingTrack) {
    const { user } = await registerPairingUser({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      track: pairingTrack,
    });
    cohort = {
      userId: user.id,
      status: user.status,
      groupId: user.groupId,
      track: user.track,
    };
  }

  return NextResponse.json({
    commit: record,
    calendarUrl: calendar.url,
    finishLabel: calendar.finishLabel,
    startLabel: calendar.startLabel,
    cohort,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { registerPairingUser } from "@/lib/pairing/store";

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  track: z.enum(["marketing", "sales", "fde"]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "track must be marketing | sales | fde, with valid name and email." },
      { status: 400 },
    );
  }

  const { user, created } = await registerPairingUser(parsed.data);

  return NextResponse.json(
    {
      userId: user.id,
      status: user.status,
      groupId: user.groupId,
      track: user.track,
      created,
    },
    { status: created ? 201 : 200 },
  );
}

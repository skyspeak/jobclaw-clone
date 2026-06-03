import { NextResponse } from "next/server";

import { getPairingStatus, touchPairingUser } from "@/lib/pairing/store";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await context.params;

  if (!userId?.trim()) {
    return NextResponse.json({ error: "userId required." }, { status: 400 });
  }

  await touchPairingUser(userId);
  const status = await getPairingStatus(userId);

  if (!status) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}

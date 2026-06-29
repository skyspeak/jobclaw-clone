import { NextResponse } from "next/server";

import { unsubscribeNewsletterByToken } from "@/lib/newsletter/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse("Missing unsubscribe token.", { status: 400 });
  }

  const unsubscribed = await unsubscribeNewsletterByToken(token);

  const body = unsubscribed
    ? `<!DOCTYPE html>
<html lang="en">
  <body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#1a1a1a;">
    <h1 style="font-size:1.5rem;">You're unsubscribed</h1>
    <p>You won't receive StayRelevant from DearCC anymore. You can sign up again anytime from your gap analysis.</p>
  </body>
</html>`
    : `<!DOCTYPE html>
<html lang="en">
  <body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#1a1a1a;">
    <h1 style="font-size:1.5rem;">Link not found</h1>
    <p>This unsubscribe link is invalid or was already used.</p>
  </body>
</html>`;

  return new NextResponse(body, {
    status: unsubscribed ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

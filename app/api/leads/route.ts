import { NextResponse } from "next/server";

import { isValidLeadGenAdminKey } from "@/lib/leads/admin";
import { listLeads } from "@/lib/leads/db";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");

  if (!isValidLeadGenAdminKey(key)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("list leads failed", error);
    return NextResponse.json({ error: "Unable to load leads." }, { status: 500 });
  }
}

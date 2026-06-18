import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { incrementInteraction } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("cn_sid");
  if (!sessionCookie) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const sessionId = await verifySession(sessionCookie.value);
  if (!sessionId) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  await incrementInteraction(sessionId);
  return NextResponse.json({ ok: true });
}

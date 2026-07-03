import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { incrementInteraction } from "@/lib/firestore";
import { enforceRecaptchaGate } from "@/lib/recaptchaGate";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const sessionCookie = request.cookies.get("cn_sid");
  if (!sessionCookie) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const sessionId = await verifySession(sessionCookie.value);
  if (!sessionId) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  // Body is optional: callers only send it on the retry after a 403, once
  // they have a token in hand.
  let recaptchaToken: string | null = null;
  let recaptchaAction = "interact";
  try {
    const body = await request.json();
    if (typeof body?.recaptchaToken === "string") recaptchaToken = body.recaptchaToken;
    if (typeof body?.recaptchaAction === "string") recaptchaAction = body.recaptchaAction;
  } catch {
    // No JSON body sent — treat as no token available yet.
  }

  const interactionCount = await incrementInteraction(sessionId);

  const gate = await enforceRecaptchaGate(sessionId, interactionCount, recaptchaToken, recaptchaAction, {
    ip,
    sessionId,
  });
  if (gate.blocked) {
    return NextResponse.json({ ok: false, ...gate.body }, { status: gate.status });
  }

  return NextResponse.json({ ok: true, interactionCount });
}

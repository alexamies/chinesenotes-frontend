import { NextRequest, NextResponse } from "next/server";
import { lookupTerm, detectInputType, reverseLookup } from "@/lib/dictionary";
import { segmentText } from "@/lib/segmentation";
import { verifySession } from "@/lib/session";
import { incrementInteraction } from "@/lib/firestore";
import { enforceRecaptchaGate } from "@/lib/recaptchaGate";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // --- Session validation ---
  const sessionCookie = request.cookies.get("cn_sid");
  if (!sessionCookie) {
    console.warn("[lookup] 401 no session cookie", { ip });
    return NextResponse.json({ found: false }, { status: 401 });
  }
  const sessionId = await verifySession(sessionCookie.value);
  if (!sessionId) {
    console.warn("[lookup] 403 invalid session signature", {
      ip,
      cookiePrefix: sessionCookie.value.slice(0, 12),
    });
    return NextResponse.json({ found: false }, { status: 403 });
  }

  // --- Parameter validation ---
  const { searchParams } = request.nextUrl;
  const term = searchParams.get("term");
  if (!term) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  // --- Interaction tracking ---
  const interactionCount = await incrementInteraction(sessionId);

  // --- reCAPTCHA enforcement above threshold ---
  const recaptchaToken = searchParams.get("recaptchaToken");
  const recaptchaAction = searchParams.get("recaptchaAction") ?? "lookup";
  const gate = await enforceRecaptchaGate(sessionId, interactionCount, recaptchaToken, recaptchaAction, {
    ip,
    sessionId,
  });
  if (gate.blocked) {
    return NextResponse.json({ found: false, ...gate.body }, { status: gate.status });
  }

  // --- Lookup ---
  if (detectInputType(term) === 'chinese') {
    const segments = segmentText(term, lookupTerm);
    return NextResponse.json({ found: true, type: 'chinese', segments, interactionCount });
  }

  const entries = reverseLookup(term);
  if (entries.length === 0) {
    return NextResponse.json({ found: false, interactionCount });
  }
  return NextResponse.json({ found: true, type: 'reverse', entries, interactionCount });
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { lookupTerm } from "@/lib/dictionary";
import { segmentText } from "@/lib/segmentation";
import { verifySession } from "@/lib/session";
import { incrementInteraction } from "@/lib/firestore";

const RECAPTCHA_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? "";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const RECAPTCHA_SCORE_THRESHOLD = 0.5;
const INTERACTION_THRESHOLD = 25;

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function verifyRecaptchaToken(token: string, action: string): Promise<boolean> {
  if (!RECAPTCHA_PROJECT_ID || !RECAPTCHA_SITE_KEY) {
    return true;
  }
  try {
    const accessToken = await auth.getAccessToken();
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${RECAPTCHA_PROJECT_ID}/assessments`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        event: { token, siteKey: RECAPTCHA_SITE_KEY, expectedAction: action },
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (
      data.tokenProperties?.valid === true &&
      (data.riskAnalysis?.score ?? 0) >= RECAPTCHA_SCORE_THRESHOLD
    );
  } catch {
    // Fail open: don't block legitimate users if reCAPTCHA is unreachable.
    return true;
  }
}

export async function GET(request: NextRequest) {
  // --- Session validation ---
  const sessionCookie = request.cookies.get("cn_sid");
  if (!sessionCookie) {
    return NextResponse.json({ found: false }, { status: 401 });
  }
  const sessionId = await verifySession(sessionCookie.value);
  if (!sessionId) {
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
  if (interactionCount > INTERACTION_THRESHOLD && RECAPTCHA_SITE_KEY) {
    const recaptchaToken = searchParams.get("recaptchaToken");
    const recaptchaAction = searchParams.get("recaptchaAction") ?? "lookup";
    if (!recaptchaToken) {
      return NextResponse.json(
        { found: false, requiresRecaptcha: true, interactionCount },
        { status: 403 }
      );
    }
    const valid = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
    if (!valid) {
      return NextResponse.json(
        { found: false, error: "reCAPTCHA verification failed", interactionCount },
        { status: 403 }
      );
    }
  }

  // --- Lookup ---
  const segments = segmentText(term, lookupTerm);
  return NextResponse.json({ found: true, segments, interactionCount });
}

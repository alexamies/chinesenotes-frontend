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
    if (!res.ok) {
      console.error("[lookup] reCAPTCHA API returned non-OK status, failing open", {
        status: res.status,
        action,
      });
      return true;
    }
    const data = await res.json();
    const tokenValid = data.tokenProperties?.valid === true;
    const score = data.riskAnalysis?.score ?? 0;
    if (!tokenValid || score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn("[lookup] reCAPTCHA assessment rejected", {
        tokenValid,
        score,
        action,
        invalidReason: data.tokenProperties?.invalidReason,
      });
    }
    return tokenValid && score >= RECAPTCHA_SCORE_THRESHOLD;
  } catch (err) {
    // Fail open: don't block legitimate users if reCAPTCHA is unreachable.
    console.error("[lookup] reCAPTCHA verification threw, failing open", err);
    return true;
  }
}

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
  if (interactionCount > INTERACTION_THRESHOLD && RECAPTCHA_SITE_KEY) {
    const recaptchaToken = searchParams.get("recaptchaToken");
    const recaptchaAction = searchParams.get("recaptchaAction") ?? "lookup";
    if (!recaptchaToken) {
      console.warn("[lookup] 403 reCAPTCHA required but token missing", {
        ip,
        sessionId,
        interactionCount,
      });
      return NextResponse.json(
        { found: false, requiresRecaptcha: true, interactionCount },
        { status: 403 }
      );
    }
    const valid = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
    if (!valid) {
      console.warn("[lookup] 403 reCAPTCHA verification failed", {
        ip,
        sessionId,
        interactionCount,
        recaptchaAction,
      });
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

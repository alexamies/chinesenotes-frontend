import { GoogleAuth } from "google-auth-library";
import { getRecaptchaStatus, recordRecaptchaResult } from "@/lib/firestore";

const RECAPTCHA_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? "";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const RECAPTCHA_SCORE_THRESHOLD = 0.5;
export const INTERACTION_THRESHOLD = 25;

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
      console.error("[recaptcha-gate] reCAPTCHA API returned non-OK status, failing open", {
        status: res.status,
        action,
      });
      return true;
    }
    const data = await res.json();
    const tokenValid = data.tokenProperties?.valid === true;
    const score = data.riskAnalysis?.score ?? 0;
    if (!tokenValid || score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn("[recaptcha-gate] reCAPTCHA assessment rejected", {
        tokenValid,
        score,
        action,
        invalidReason: data.tokenProperties?.invalidReason,
      });
    }
    return tokenValid && score >= RECAPTCHA_SCORE_THRESHOLD;
  } catch (err) {
    // Fail open: don't block legitimate users if reCAPTCHA is unreachable.
    console.error("[recaptcha-gate] reCAPTCHA verification threw, failing open", err);
    return true;
  }
}

export type GateResult =
  | { blocked: false }
  | { blocked: true; status: number; body: Record<string, unknown> };

/**
 * Shared enforcement used by every session-gated API route (dictionary
 * lookup, library link/page-view interactions). Once a session crosses
 * INTERACTION_THRESHOLD in a day, every further request from it must carry
 * a passing reCAPTCHA assessment (or already be humanVerified) or it is
 * blocked with 403. Sessions with 3+ failed assessments are blocked outright.
 */
export async function enforceRecaptchaGate(
  sessionId: string,
  interactionCount: number,
  recaptchaToken: string | null,
  recaptchaAction: string,
  logCtx: Record<string, unknown>
): Promise<GateResult> {
  if (!(interactionCount > INTERACTION_THRESHOLD && RECAPTCHA_SITE_KEY)) {
    return { blocked: false };
  }

  const { humanVerified, botCount } = await getRecaptchaStatus(sessionId);

  if (botCount >= 3) {
    console.warn("[recaptcha-gate] 403 session identified as bot", { ...logCtx, botCount });
    return { blocked: true, status: 403, body: { error: "Access denied" } };
  }

  if (humanVerified) {
    return { blocked: false };
  }

  if (!recaptchaToken) {
    console.warn("[recaptcha-gate] 403 reCAPTCHA required but token missing", {
      ...logCtx,
      interactionCount,
    });
    return { blocked: true, status: 403, body: { requiresRecaptcha: true, interactionCount } };
  }

  const valid = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
  await recordRecaptchaResult(sessionId, valid);
  if (!valid) {
    console.warn("[recaptcha-gate] 403 reCAPTCHA verification failed", {
      ...logCtx,
      interactionCount,
      recaptchaAction,
    });
    return { blocked: true, status: 403, body: { error: "reCAPTCHA verification failed", interactionCount } };
  }

  return { blocked: false };
}

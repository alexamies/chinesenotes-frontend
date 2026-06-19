export const INTERACTION_THRESHOLD = 25;

// Module-level cache of the last interaction count reported by the server.
// Updated after each successful API response so the client knows when to
// start including reCAPTCHA tokens.
let _knownInteractionCount = 0;

export function updateInteractionCount(count: number): void {
  if (count > _knownInteractionCount) _knownInteractionCount = count;
}

export function isKnownOverThreshold(): boolean {
  return _knownInteractionCount > INTERACTION_THRESHOLD;
}

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

function waitForGrecaptcha(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.grecaptcha?.enterprise) return Promise.resolve(true);
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      if (window.grecaptcha?.enterprise) { resolve(true); return; }
      if (Date.now() >= deadline) { resolve(false); return; }
      setTimeout(poll, 100);
    };
    setTimeout(poll, 100);
  });
}

function getSiteKey(): string | undefined {
  // Prefer the build-time baked value; fall back to reading the key from the
  // script URL that the server rendered, which works when the env var was only
  // available at runtime (not at build time).
  const baked = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (baked) return baked;
  if (typeof document === "undefined") return undefined;
  const src = document.querySelector<HTMLScriptElement>(
    'script[src*="recaptcha/enterprise.js"]'
  )?.src;
  if (!src) return undefined;
  try {
    return new URL(src).searchParams.get("render") ?? undefined;
  } catch {
    return undefined;
  }
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const siteKey = getSiteKey();
  if (!siteKey) return null;
  if (typeof window === "undefined") return null;

  const available = await waitForGrecaptcha();
  if (!available) {
    console.warn("[recaptcha] grecaptcha.enterprise not available after timeout", { action });
    return null;
  }

  return new Promise<string | null>((resolve) => {
    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
        resolve(token);
      } catch (err) {
        console.warn("[recaptcha] grecaptcha.execute failed", { action, err });
        resolve(null);
      }
    });
  });
}

// Uses Web Crypto API so this module is safe in both Edge (middleware) and Node.js (API routes).

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

async function computeHmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function createSession(): Promise<{ id: string; value: string }> {
  const id = generateId();
  const secret = getSecret();
  if (!secret) {
    return { id, value: `${id}.nosig` };
  }
  const sig = await computeHmac(secret, id);
  return { id, value: `${id}.${sig}` };
}

/** Returns the session ID if the cookie is valid, or null if the signature is wrong. */
export async function verifySession(cookieValue: string): Promise<string | null> {
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return null;
  const id = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const secret = getSecret();
  if (!secret) {
    // No secret configured: accept any cookie (development / unconfigured mode).
    return id;
  }
  const expected = await computeHmac(secret, id);
  if (sig.length !== expected.length) return null;
  // Constant-time comparison to prevent timing attacks.
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0 ? id : null;
}

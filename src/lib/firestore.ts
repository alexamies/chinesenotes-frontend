import { Firestore } from "@google-cloud/firestore";

let _db: Firestore | undefined;

function getDb(): Firestore {
  if (!_db) {
    _db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || undefined,
    });
  }
  return _db;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically increments the daily interaction count for a session.
 * Resets to 1 when the calendar date changes.
 * Uses merge so humanVerified / botCount are never overwritten.
 * Returns the new count, or 0 if Firestore is unavailable.
 */
export async function incrementInteraction(sessionId: string): Promise<number> {
  try {
    const db = getDb();
    const ref = db.collection("sessions").doc(sessionId);
    const today = todayISO();

    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      let count: number;
      if (!snap.exists || snap.data()?.date !== today) {
        count = 1;
      } else {
        count = ((snap.data()?.count as number) ?? 0) + 1;
      }
      tx.set(ref, { count, date: today }, { merge: true });
      return count;
    });
  } catch (err) {
    console.error("Firestore incrementInteraction failed:", err);
    return 0;
  }
}

export interface RecaptchaStatus {
  humanVerified: boolean;
  botCount: number;
}

/** Returns the stored reCAPTCHA verification status for a session. */
export async function getRecaptchaStatus(sessionId: string): Promise<RecaptchaStatus> {
  try {
    const snap = await getDb().collection("sessions").doc(sessionId).get();
    const data = snap.data();
    return {
      humanVerified: data?.humanVerified === true,
      botCount: (data?.botCount as number) ?? 0,
    };
  } catch (err) {
    console.error("Firestore getRecaptchaStatus failed:", err);
    return { humanVerified: false, botCount: 0 };
  }
}

/**
 * Records the result of a reCAPTCHA assessment.
 * Sets humanVerified=true on the first passing check.
 * Increments botCount on each failing check.
 */
export async function recordRecaptchaResult(
  sessionId: string,
  isHuman: boolean
): Promise<void> {
  try {
    const db = getDb();
    const ref = db.collection("sessions").doc(sessionId);
    if (isHuman) {
      await ref.set({ humanVerified: true }, { merge: true });
    } else {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const prev = (snap.data()?.botCount as number) ?? 0;
        tx.set(ref, { botCount: prev + 1 }, { merge: true });
      });
    }
  } catch (err) {
    console.error("Firestore recordRecaptchaResult failed:", err);
  }
}

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
      tx.set(ref, { count, date: today });
      return count;
    });
  } catch (err) {
    console.error("Firestore incrementInteraction failed:", err);
    return 0;
  }
}

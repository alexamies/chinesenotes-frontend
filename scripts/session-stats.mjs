// Reports counts from the Firestore "sessions" collection. Requires
// Application Default Credentials — run
// `gcloud auth application-default login` first, or set
// GOOGLE_APPLICATION_CREDENTIALS to a service account key.
//
// Usage: GOOGLE_CLOUD_PROJECT=<project-id> node scripts/session-stats.mjs
//
// chinesenotes.com, ntireader.org, and hbreader.org share one GCP project,
// so this collection holds sessions from all three. Docs are only stamped
// with a "site" field (from SITE_THEME) as of the deploy that added this
// field; sessions created before that deploy have no "site" field and are
// reported separately as "unattributed (pre-migration)".
//
// This does a single unfiltered read with a field-mask projection (site,
// updatedAt, humanVerified, botCount only — not full documents) and
// aggregates in JS, rather than per-site .count() queries, because
// Firestore requires a composite index for a query that combines an
// equality filter (site == X) with a range filter (updatedAt >= Y) on a
// different field, which can't be created from a script. The sessions
// collection is small (one doc per unique visitor, not per request), so a
// full scan is cheap. If it grows into the tens of thousands, switch to
// per-field aggregate .count() queries with composite indexes instead.

import { Firestore } from "@google-cloud/firestore";

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error("GOOGLE_CLOUD_PROJECT must be set.");
  process.exit(1);
}

const db = new Firestore({ projectId });
const KNOWN_SITES = ["chinesenotes", "ntireader", "hbreader", "demo"];
const oneHourAgoMs = Date.now() - 60 * 60 * 1000;

const snap = await db
  .collection("sessions")
  .select("site", "updatedAt", "humanVerified", "botCount", "count")
  .get();

function emptyBucket() {
  return { total: 0, lastHour: 0, humanVerified: 0, flaggedBot: 0 };
}

const buckets = new Map();
const recent = [];

for (const doc of snap.docs) {
  const d = doc.data();
  const site = d.site ?? "unattributed (pre-migration)";
  if (!buckets.has(site)) buckets.set(site, emptyBucket());
  const b = buckets.get(site);

  b.total += 1;
  const updatedAtMs = d.updatedAt?.toMillis?.();
  if (updatedAtMs && updatedAtMs >= oneHourAgoMs) b.lastHour += 1;
  if (d.humanVerified === true) b.humanVerified += 1;
  if ((d.botCount ?? 0) >= 1) b.flaggedBot += 1;

  recent.push({ id: doc.id, site, updatedAtMs, count: d.count });
}

function printRow(label, c) {
  console.log(
    `${label.padEnd(28)} total=${String(c.total).padEnd(6)} lastHour=${String(c.lastHour).padEnd(6)} humanVerified=${String(c.humanVerified).padEnd(6)} botCount>=1=${c.flaggedBot}`
  );
}

const overall = emptyBucket();
overall.total = snap.size;
for (const b of buckets.values()) {
  overall.lastHour += b.lastHour;
  overall.humanVerified += b.humanVerified;
  overall.flaggedBot += b.flaggedBot;
}

console.log("=== Overall (all sites, includes pre-migration docs with no `site` field) ===");
printRow("all sessions", overall);

console.log("\n=== Per site ===");
for (const site of KNOWN_SITES) {
  printRow(site, buckets.get(site) ?? emptyBucket());
}
if (buckets.has("unattributed (pre-migration)")) {
  printRow("unattributed (pre-migration)", buckets.get("unattributed (pre-migration)"));
}

console.log("\n=== 10 most recently updated sessions (sanity check that writes are happening) ===");
recent.sort((a, b) => (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0));
if (recent.length === 0 || !recent[0].updatedAtMs) {
  console.log("(no session has an updatedAt field yet)");
} else {
  for (const r of recent.slice(0, 10)) {
    const ts = r.updatedAtMs ? new Date(r.updatedAtMs).toISOString() : "(none)";
    console.log(
      `${r.id.slice(0, 8)}…  site=${r.site.padEnd(12)} count=${String(r.count ?? "?").padEnd(4)} updatedAt=${ts}`
    );
  }
}

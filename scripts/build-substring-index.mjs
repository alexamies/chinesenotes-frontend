import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dictPath = join(root, "data", "dictionary.json");
const outPath = join(root, "data", "substring-index.json");

if (!existsSync(dictPath)) {
  console.log("data/dictionary.json not found; skipping substring index build");
  process.exit(0);
}

// Skip rebuild if index is newer than dictionary
if (existsSync(outPath)) {
  const dictMtime = statSync(dictPath).mtimeMs;
  const idxMtime = statSync(outPath).mtimeMs;
  if (idxMtime >= dictMtime) {
    console.log("data/substring-index.json is up to date; skipping rebuild");
    process.exit(0);
  }
}

console.log("Building substring index from data/dictionary.json …");

const entries = JSON.parse(readFileSync(dictPath, "utf-8"));

// Collect unique headwords (simplified and traditional)
const headwords = new Set();
for (const e of entries) {
  headwords.add(e.s);
  if (e.t && e.t !== e.s) headwords.add(e.t);
}
console.log(`  ${headwords.size} unique headword forms`);

// For each headword H, extract all proper substrings that are also headwords.
// Add H to the reverse index under each such substring key.
// index: substring -> Set of containing headwords
const index = new Map();

for (const hw of headwords) {
  const len = hw.length;
  for (let start = 0; start < len; start++) {
    for (let end = start + 1; end <= len; end++) {
      if (end - start === len) continue; // skip the full string itself
      const sub = hw.slice(start, end);
      if (headwords.has(sub)) {
        let bucket = index.get(sub);
        if (!bucket) {
          bucket = new Set();
          index.set(sub, bucket);
        }
        bucket.add(hw);
      }
    }
  }
}

// Convert to sorted arrays (decreasing length, then lexicographic), cap at 50
const result = {};
for (const [term, containers] of index) {
  const sorted = [...containers].sort((a, b) => b.length - a.length || a.localeCompare(b));
  result[term] = sorted.slice(0, 50);
}

writeFileSync(outPath, JSON.stringify(result));
console.log(`  Built data/substring-index.json: ${Object.keys(result).length} indexed terms`);

import { copyFileSync, existsSync, mkdirSync, createReadStream, createWriteStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "data", "dictionary.json");
// SITE unset means "auto": preserve an existing dictionary rather than overwrite with demo.
// SITE=demo explicitly resets to the demo source.
const site = process.env.SITE ?? null;

const CONFIGS = {
  demo: null,
  chinesenotes: {
    repoRoot: join(root, "..", "chinesenotes.com"),
    files: [
      "data/cnotes_zh_en_dict.tsv",
      "data/modern_named_entities.txt",
      "data/translation_memory_literary.txt",
      "data/translation_memory_modern.txt",
    ],
  },
  ntireader: {
    repoRoot: join(root, "..", "buddhist-dictionary"),
    files: [
      "data/dictionary/buddhist_named_entities.txt",
      "data/dictionary/buddhist_terminology.txt",
      "data/dictionary/cnotes_zh_en_dict.tsv",
      "data/dictionary/fgs_mwe.txt",
      "data/dictionary/translation_memory_buddhist.txt",
      "data/dictionary/translation_memory_hsingyun.txt",
      "data/dictionary/translation_memory_literary.txt",
    ],
  },
  hbreader: {
    repoRoot: join(root, "..", "hbreader"),
    files: [
      "data/dictionary/buddhist_named_entities.txt",
      "data/dictionary/buddhist_terminology.txt",
      "data/dictionary/cnotes_zh_en_dict.tsv",
      "data/dictionary/fgs_mwe.txt",
      "data/dictionary/modern_named_entities.txt",
      "data/dictionary/translation_memory_buddhist.txt",
      "data/dictionary/translation_memory_hsingyun.txt",
      "data/dictionary/translation_memory_literary.txt",
      "data/dictionary/translation_memory_modern.txt",
    ],
  },
};

mkdirSync(join(root, "data"), { recursive: true });

// SITE not set: preserve existing dictionary; fall back to demo only when none exists.
if (site === null) {
  if (existsSync(outPath)) {
    console.log("SITE not set; keeping existing data/dictionary.json");
  } else {
    copyFileSync(join(root, "assets", "example_dictionary.json"), outPath);
    console.log("SITE not set and no existing dictionary; copied assets/example_dictionary.json → data/dictionary.json");
  }
  process.exit(0);
}

if (!(site in CONFIGS)) {
  console.error(`Unknown SITE: "${site}". Valid options: ${Object.keys(CONFIGS).join(", ")}`);
  process.exit(1);
}

if (site === "demo") {
  copyFileSync(join(root, "assets", "example_dictionary.json"), outPath);
  console.log("Copied assets/example_dictionary.json → data/dictionary.json");
  process.exit(0);
}

const cfg = CONFIGS[site];
const sourcePaths = cfg.files.map((f) => join(cfg.repoRoot, f));
const foundPaths = sourcePaths.filter((p) => existsSync(p));

if (foundPaths.length === 0) {
  if (existsSync(outPath)) {
    console.log(`No source files found for SITE='${site}'; keeping existing data/dictionary.json`);
  } else {
    copyFileSync(join(root, "assets", "example_dictionary.json"), outPath);
    console.log(`No source files found for SITE='${site}'; copied assets/example_dictionary.json → data/dictionary.json`);
  }
  process.exit(0);
}

function parseLine(line) {
  if (line.startsWith("#") || line.trim() === "") return null;

  const cols = line.split("\t");
  // TSV columns: headword_id, simplified, traditional, pinyin, english, grammar,
  //              concept_zh, concept_en, domain_zh, domain_en,
  //              subdomain_zh, subdomain_en, ?, ?, notes, word_id
  // headword_id (col 0) is unique per entry/sense row and is used as the dedup key.
  // word_id (col 15) groups the different senses of the same word together.
  const headwordId  = cols[0];
  const simplified  = cols[1];
  const traditional = cols[2] === "\\N" ? simplified : cols[2];
  const pinyin      = cols[3];
  const english     = cols[4];
  const grammar     = cols[5];
  const conceptZh   = cols[6];
  const conceptEn   = cols[7];
  const domainZh    = cols[8];
  const domainEn    = cols[9];
  const subdomainZh = cols[10];
  const subdomainEn = cols[11];
  const notes       = cols[14];

  if (!simplified || !pinyin || !english) return null;

  const entry = { s: simplified, t: traditional, p: pinyin, e: english, g: grammar, h: headwordId };

  if (domainEn && domainEn !== "\\N") {
    entry.d = domainZh && domainZh !== "\\N" ? `${domainEn} ${domainZh}` : domainEn;
  }

  if (subdomainEn && subdomainEn !== "\\N") {
    entry.sd = subdomainZh && subdomainZh !== "\\N" ? `${subdomainEn} ${subdomainZh}` : subdomainEn;
  }

  const concept = conceptEn && conceptEn !== "\\N"
    ? (conceptZh && conceptZh !== "\\N" ? `${conceptEn} ${conceptZh}` : conceptEn)
    : null;

  const rawNotes = notes && notes !== "\\N" ? notes : null;
  const fullNotes = concept && rawNotes ? `${concept}. ${rawNotes}`
    : concept ? concept
    : rawNotes;
  if (fullNotes) entry.n = fullNotes;

  // headword_id (col 0) is unique per sense row; use it as the dedup key so
  // different senses are preserved while exact duplicates across source files
  // are collapsed. Fall back to simplified|traditional|pinyin if absent.
  const key = headwordId && headwordId !== "\\N" && headwordId.trim()
    ? headwordId.trim()
    : `${simplified}|${traditional}|${pinyin}`;

  return { key, entry };
}

async function processFile(filePath) {
  const entries = new Map();
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  await new Promise((resolve) => {
    rl.on("line", (line) => {
      const parsed = parseLine(line);
      if (parsed) entries.set(parsed.key, parsed.entry);
    });
    rl.on("close", resolve);
  });
  return entries;
}

async function main() {
  const allEntries = new Map();

  for (const filePath of sourcePaths) {
    if (!existsSync(filePath)) {
      console.warn(`Warning: source file not found, skipping: ${filePath}`);
      continue;
    }
    const entries = await processFile(filePath);
    for (const [key, entry] of entries) {
      allEntries.set(key, entry);
    }
    console.log(`  ${entries.size} entries from ${filePath}`);
  }

  const out = createWriteStream(outPath);
  out.write("[\n");
  let first = true;
  for (const entry of allEntries.values()) {
    out.write((first ? "" : ",\n") + JSON.stringify(entry));
    first = false;
  }
  out.write("\n]\n");
  await new Promise((resolve, reject) => {
    out.on("finish", resolve);
    out.on("error", reject);
    out.end();
  });

  console.log(`Built data/dictionary.json for SITE='${site}': ${allEntries.size} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

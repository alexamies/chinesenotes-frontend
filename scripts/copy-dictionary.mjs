import { copyFileSync, existsSync, mkdirSync, createReadStream, createWriteStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsvPath = join(root, "..", "chinesenotes.com", "data", "cnotes_zh_en_dict.tsv");
const outPath = join(root, "data", "dictionary.json");

mkdirSync(join(root, "data"), { recursive: true });

if (!existsSync(tsvPath)) {
  copyFileSync(join(root, "assets", "example_dictionary.json"), outPath);
  console.log("TSV not found; copied assets/example_dictionary.json → data/dictionary.json");
  process.exit(0);
}

const out = createWriteStream(outPath);
out.write("[\n");

const rl = createInterface({ input: createReadStream(tsvPath), crlfDelay: Infinity });

let first = true;
let count = 0;

rl.on("line", (line) => {
  if (line.startsWith("#") || line.trim() === "") return;

  const cols = line.split("\t");
  // TSV columns: id, simplified, traditional, pinyin, english, grammar,
  //              ?, ?, domain_zh, domain_en, subdomain_zh, subdomain_en,
  //              ?, ?, notes, headword_id
  const simplified  = cols[1];
  const traditional = cols[2] === "\\N" ? simplified : cols[2];
  const pinyin      = cols[3];
  const english     = cols[4];
  const grammar     = cols[5];
  const domainEn    = cols[9];
  const domainZh    = cols[8];
  const notes       = cols[14];
  const headwordId  = cols[15];

  if (!simplified || !pinyin || !english) return;

  const entry = { s: simplified, t: traditional, p: pinyin, e: english, g: grammar, h: headwordId };

  if (domainEn && domainEn !== "\\N") {
    entry.d = domainZh && domainZh !== "\\N" ? `${domainEn} ${domainZh}` : domainEn;
  }

  if (notes && notes !== "\\N") {
    entry.n = notes;
  }

  out.write((first ? "" : ",\n") + JSON.stringify(entry));
  first = false;
  count++;
});

rl.on("close", () => {
  out.write("\n]\n");
  out.end();
  console.log(`Built data/dictionary.json from TSV: ${count} entries`);
});

import { copyFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "assets", "references.html");
const site = process.env.SITE ?? null;

const SOURCE_PATHS = {
  chinesenotes: join(root, "..", "chinesenotes.com", "html", "references-raw.html"),
  ntireader:    join(root, "..", "buddhist-dictionary", "html", "references.html"),
  hbreader:     join(root, "..", "hbreader", "html", "references.html"),
};

const srcPath = site ? SOURCE_PATHS[site] : null;

if (srcPath && existsSync(srcPath)) {
  copyFileSync(srcPath, outPath);
  console.log(`Copied references HTML for SITE='${site}': ${srcPath}`);
} else if (existsSync(outPath)) {
  console.log(`Source for SITE='${site ?? "demo"}' not found; keeping existing assets/references.html`);
} else {
  writeFileSync(outPath, "");
  console.log(`No references source found for SITE='${site ?? "demo"}'; wrote empty placeholder`);
}

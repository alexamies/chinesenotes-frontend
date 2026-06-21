import { copyFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = process.env.SITE ?? null;

const PAGES = [
  {
    name: "references",
    out: join(root, "assets", "references.html"),
    sources: {
      chinesenotes: join(root, "..", "chinesenotes.com", "html", "references-raw.html"),
      ntireader:    join(root, "..", "buddhist-dictionary", "html", "references.html"),
      hbreader:     join(root, "..", "hbreader", "html", "references.html"),
    },
  },
  {
    name: "abbreviations",
    out: join(root, "assets", "abbreviations.html"),
    sources: {
      chinesenotes: join(root, "..", "chinesenotes.com", "html", "abbreviations-raw.html"),
      ntireader:    join(root, "..", "buddhist-dictionary", "html", "abbreviations.html"),
      hbreader:     join(root, "..", "hbreader", "html", "abbreviations.html"),
    },
  },
];

for (const { name, out, sources } of PAGES) {
  const srcPath = site ? sources[site] : null;

  if (srcPath && existsSync(srcPath)) {
    copyFileSync(srcPath, out);
    console.log(`Copied ${name} HTML for SITE='${site}': ${srcPath}`);
  } else if (existsSync(out)) {
    console.log(`Source for SITE='${site ?? "demo"}' not found; keeping existing assets/${name}.html`);
  } else {
    writeFileSync(out, "");
    console.log(`No ${name} source found for SITE='${site ?? "demo"}'; wrote empty placeholder`);
  }
}

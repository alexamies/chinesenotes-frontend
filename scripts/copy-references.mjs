import { copyFileSync, existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
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
    const html = readFileSync(srcPath, "utf-8");
    writeFileSync(out, html.replace(/src="external-link\.svg"/g, 'src="/external-link.svg"'));
    console.log(`Copied ${name} HTML for SITE='${site}': ${srcPath}`);
  } else if (existsSync(out)) {
    console.log(`Source for SITE='${site ?? "demo"}' not found; keeping existing assets/${name}.html`);
  } else {
    writeFileSync(out, "");
    console.log(`No ${name} source found for SITE='${site ?? "demo"}'; wrote empty placeholder`);
  }
}

// ── Resources page + internally-linked resource pages ────────────────────────

function applyRewrites(html, rewrites) {
  let result = html;
  for (const [pattern, replacement] of rewrites) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

const RESOURCES = {
  chinesenotes: {
    src: join(root, "..", "chinesenotes.com", "html", "resources.html"),
    linkedDir: join(root, "..", "chinesenotes.com", "html"),
    linkedSlugs: [
      "chrome-extension",
      "dynasties",
      "twenty_four_histories",
      "syllables_ipa",
    ],
    rewrites: [
      [/href=["']chrome-extension\.html["']/g,      'href="/resource-pages/chrome-extension"'],
      [/href=["']dynasties\.html["']/g,              'href="/resource-pages/dynasties"'],
      [/href=["']twenty_four_histories\.html["']/g,  'href="/resource-pages/twenty_four_histories"'],
      [/href=["']syllables_ipa\.html["']/g,          'href="/resource-pages/syllables_ipa"'],
    ],
  },
  ntireader: {
    src: join(root, "..", "buddhist-dictionary", "html", "dict_resources.html"),
    linkedDir: join(root, "..", "buddhist-dictionary", "html"),
    linkedSlugs: [
      "faq",
      "about_chinese_canon",
      "translation_workflow",
      "sanskrit_in_buddhism",
      "buddhist_style_guide",
      "annotation",
      "word_freq",
      "tools",
      "ntireader_metadata",
    ],
    rewrites: [
      [/href=["']faq\.html["']/g,                    'href="/resource-pages/faq"'],
      [/href=["']about_chinese_canon\.html["']/g,    'href="/resource-pages/about_chinese_canon"'],
      [/href=["']references\.html["']/g,             'href="/references"'],
      [/href=["']abbreviations\.html["']/g,          'href="/abbreviations"'],
      [/href=["']\/abbreviations\.html["']/g,        'href="/abbreviations"'],
      [/href=["']translation_workflow\.html["']/g,   'href="/resource-pages/translation_workflow"'],
      [/href=["']sanskrit_in_buddhism\.html["']/g,   'href="/resource-pages/sanskrit_in_buddhism"'],
      [/href=["']buddhist_style_guide\.html["']/g,   'href="/resource-pages/buddhist_style_guide"'],
      [/href=["']annotation\.html["']/g,             'href="/resource-pages/annotation"'],
      [/href=["']word_freq\.html["']/g,              'href="/resource-pages/word_freq"'],
      [/href=["']tools\.html["']/g,                  'href="/resource-pages/tools"'],
      [/href=["']ntireader_metadata\.html["']/g,     'href="/resource-pages/ntireader_metadata"'],
    ],
  },
  hbreader: {
    src: join(root, "..", "hbreader", "html", "resources.html"),
    linkedDir: join(root, "..", "hbreader", "html"),
    linkedSlugs: [
      "fgs_references",
      "general_references",
    ],
    rewrites: [
      [/href=["']\/abbreviations\.html["']/g,        'href="/abbreviations"'],
      [/href=["']\/fgs_references\.html["']/g,       'href="/resource-pages/fgs_references"'],
      [/href=["']\/references\.html["']/g,           'href="/references"'],
      [/href=["']\/general_references\.html["']/g,   'href="/resource-pages/general_references"'],
    ],
  },
};

const resourcesPagesDir = join(root, "assets", "resource-pages");
mkdirSync(resourcesPagesDir, { recursive: true });

const resourcesOut = join(root, "assets", "resources.html");
const config = site ? RESOURCES[site] : null;

if (config && existsSync(config.src)) {
  // Copy and rewrite the main resources page
  const html = readFileSync(config.src, "utf-8");
  writeFileSync(resourcesOut, applyRewrites(html, config.rewrites));
  console.log(`Copied resources HTML for SITE='${site}': ${config.src}`);

  // Copy and rewrite each linked resource page
  for (const slug of config.linkedSlugs) {
    const srcFile = join(config.linkedDir, `${slug}.html`);
    const outFile = join(resourcesPagesDir, `${slug}.html`);
    if (existsSync(srcFile)) {
      const pageHtml = readFileSync(srcFile, "utf-8");
      writeFileSync(outFile, applyRewrites(pageHtml, config.rewrites));
      console.log(`  Copied resource-page ${slug}.html`);
    } else {
      console.log(`  Skipping ${slug}.html (not found)`);
    }
  }
} else if (existsSync(resourcesOut)) {
  console.log(`Source for SITE='${site ?? "demo"}' not found; keeping existing assets/resources.html`);
} else {
  writeFileSync(resourcesOut, "");
  console.log(`No resources source found for SITE='${site ?? "demo"}'; wrote empty placeholder`);
}

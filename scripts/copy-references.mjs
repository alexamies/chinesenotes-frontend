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
    writeFileSync(out, html
      .replace(/src="\/images\/external-link\.svg"/g, 'src="/external-link.svg"')
      .replace(/src="external-link\.svg"/g, 'src="/external-link.svg"'));
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

// ── About page + internally-linked sub-pages ─────────────────────────────────

const ABOUT_REWRITES_CHINESENOTES = [
  [/href=["']references\.html["']/g,              'href="/references"'],
  [/href=["']abbreviations\.html["']/g,           'href="/abbreviations"'],
  [/href=["']\/abbreviations\.html["']/g,         'href="/abbreviations"'],
  [/href=["']resources\.html["']/g,               'href="/resources"'],
  [/href=["']help\.html["']/g,                    'href="/resource-pages/help"'],
  [/href=["']help2\.html#word_detail["']/g,       'href="/resource-pages/help2#word_detail"'],
  [/href=["']help2\.html#english["']/g,           'href="/resource-pages/help2#english"'],
  [/href=["']help2\.html["']/g,                   'href="/resource-pages/help2"'],
  [/href=["']help3\.html#results["']/g,           'href="/resource-pages/help3#results"'],
  [/href=["']help3\.html["']/g,                   'href="/resource-pages/help3"'],
  [/href=["']help4\.html["']/g,                   'href="/resource-pages/help4"'],
  [/href=["']help5\.html["']/g,                   'href="/resource-pages/help5"'],
  [/href=["']help6\.html#quotations["']/g,        'href="/resource-pages/help6#quotations"'],
  [/href=["']help6\.html["']/g,                   'href="/resource-pages/help6"'],
  [/href=["']dictionary_design\.html["']/g,       'href="/resource-pages/dictionary_design"'],
  [/href=["']corpus\.html["']/g,                  'href="/resource-pages/corpus"'],
  [/href=["']style_guide\.html["']/g,             'href="/resource-pages/style_guide"'],
  [/href=["']chrome-extension\.html["']/g,        'href="/resource-pages/chrome-extension"'],
  [/href=["']dictionary_templates\.html["']/g,    'href="/resource-pages/dictionary_templates"'],
];

const ABOUT = {
  chinesenotes: {
    src: join(root, "..", "chinesenotes.com", "html", "about-raw.html"),
    linkedDir: join(root, "..", "chinesenotes.com", "html"),
    // { slug: URL slug, file: source filename in linkedDir }
    linkedPages: [
      { slug: "help",                 file: "help-raw.html" },
      { slug: "help2",                file: "help2-raw.html" },
      { slug: "help3",                file: "help3-raw.html" },
      { slug: "help4",                file: "help4-raw.html" },
      { slug: "help5",                file: "help5-raw.html" },
      { slug: "help6",                file: "help6-raw.html" },
      { slug: "dictionary_design",    file: "dictionary_design-raw.html" },
      { slug: "corpus",               file: "corpus.html" },
      { slug: "style_guide",          file: "style_guide-raw.html" },
      { slug: "dictionary_templates", file: "dictionary_templates.html" },
    ],
    rewrites: ABOUT_REWRITES_CHINESENOTES,
  },
  ntireader: {
    src: join(root, "..", "buddhist-dictionary", "html", "about.html"),
    linkedDir: join(root, "..", "buddhist-dictionary", "html"),
    linkedPages: [
      { slug: "annotation",           file: "annotation.html" },
      { slug: "corpus",               file: "corpus.html" },
      { slug: "whatsnew",             file: "whatsnew.html" },
      { slug: "publications",         file: "publications.html" },
    ],
    rewrites: [
      [/href=["']annotation\.html["']/g,                   'href="/resource-pages/annotation"'],
      [/href=["']corpus\.html["']/g,                       'href="/resource-pages/corpus"'],
      [/href=["']faq\.html["']/g,                          'href="/resource-pages/faq"'],
      [/href=["']translation_workflow\.html#casual["']/g,  'href="/resource-pages/translation_workflow#casual"'],
      [/href=["']translation_workflow\.html#contributor["']/g, 'href="/resource-pages/translation_workflow#contributor"'],
      [/href=["']translation_workflow\.html["']/g,         'href="/resource-pages/translation_workflow"'],
      [/href=["']whatsnew\.html["']/g,                     'href="/resource-pages/whatsnew"'],
      [/href=["']references\.html["']/g,                   'href="/references"'],
      [/href=["']\/publications\.html["']/g,               'href="/resource-pages/publications"'],
    ],
  },
  hbreader: {
    src: join(root, "..", "hbreader", "html", "about.html"),
    linkedDir: null,
    linkedPages: [],
    rewrites: [],
  },
};

const aboutOut = join(root, "assets", "about.html");
const aboutConfig = site ? ABOUT[site] : null;

if (aboutConfig && existsSync(aboutConfig.src)) {
  const html = readFileSync(aboutConfig.src, "utf-8");
  writeFileSync(aboutOut, applyRewrites(html, aboutConfig.rewrites));
  console.log(`Copied about HTML for SITE='${site}': ${aboutConfig.src}`);

  for (const { slug, file } of aboutConfig.linkedPages) {
    const srcFile = join(aboutConfig.linkedDir, file);
    const outFile = join(resourcesPagesDir, `${slug}.html`);
    if (existsSync(srcFile)) {
      const pageHtml = readFileSync(srcFile, "utf-8");
      writeFileSync(outFile, applyRewrites(pageHtml, aboutConfig.rewrites));
      console.log(`  Copied about-linked page ${slug}.html`);
    } else {
      console.log(`  Skipping ${slug}.html (not found at ${srcFile})`);
    }
  }
} else if (existsSync(aboutOut)) {
  console.log(`Source for SITE='${site ?? "demo"}' not found; keeping existing assets/about.html`);
} else {
  writeFileSync(aboutOut, "");
  console.log(`No about source found for SITE='${site ?? "demo"}'; wrote empty placeholder`);
}

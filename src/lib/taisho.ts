import fs from "fs/promises";
import path from "path";

export interface TaishoTextLink {
  id: string;    // e.g. "t0001"
  label: string; // display text
}

export interface TaishoVolume {
  volumeId: string;    // e.g. "t01", "t05-7"
  volumeTitle: string; // e.g. "Volume 1" or "Volumes 5-7 大般若..."
  descriptionText: string;
  popularTexts: TaishoTextLink[];
}

export interface TaishoSection {
  heading: string;
  volumes: TaishoVolume[];
}

export interface TaishoIndex {
  sections: TaishoSection[];
}

export interface TaishoVolumeText {
  number: number;
  id: string;    // e.g. "t0001"
  title: string;
}

function getBuddhistDictHtmlDir(): string {
  return path.join(process.cwd(), "..", "buddhist-dictionary", "html");
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTextLinks(html: string): TaishoTextLink[] {
  const links: TaishoTextLink[] = [];
  // Match /taisho/tNNNN.html links, tolerating malformed attributes between quote and >
  const re = /href=['"]\/taisho\/(t\d+)\.html[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    links.push({ id: m[1], label: m[2].replace(/\s+/g, " ").trim() });
  }
  return links;
}

export async function parseTaishoIndex(): Promise<TaishoIndex> {
  const html = await fs.readFile(
    path.join(getBuddhistDictHtmlDir(), "taisho.html"),
    "utf-8"
  );

  const sections: TaishoSection[] = [];
  // Each section: <h3>HEADING</h3> followed by <ul ...>...</ul>
  const sectionRe = /<h3>([\s\S]*?)<\/h3>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g;
  let sec: RegExpExecArray | null;

  while ((sec = sectionRe.exec(html)) !== null) {
    const heading = sec[1].trim();
    const ulHtml = sec[2];

    const volumes: TaishoVolume[] = [];
    const liRe = /<li\s+class="mdc-list-item">([\s\S]*?)<\/li>/g;
    let li: RegExpExecArray | null;

    while ((li = liRe.exec(ulHtml)) !== null) {
      const liHtml = li[1];

      const primaryMatch = liHtml.match(
        /<span\s+class="mdc-list-item__primary-text">([\s\S]*?)<\/span>/
      );
      const secondaryMatch = liHtml.match(
        /<span\s+class="mdc-list-item__secondary-text">([\s\S]*?)<\/span>/
      );

      if (!primaryMatch) continue;

      const primaryHtml = primaryMatch[1];
      const secondaryHtml = secondaryMatch ? secondaryMatch[1] : "";

      // Extract volume link: href="t01.html" or href="t05-7.html"
      const volumeLinkMatch = primaryHtml.match(
        /<a\s+href="(t[\w-]+\.html)"[^>]*>([\s\S]*?)<\/a>/
      );

      const volumeId = volumeLinkMatch
        ? volumeLinkMatch[1].replace(/\.html$/, "")
        : "";
      const volumeTitle = volumeLinkMatch
        ? volumeLinkMatch[2].replace(/\s+/g, " ").trim()
        : stripTags(primaryHtml);

      const descriptionText = stripTags(secondaryHtml);
      const popularTexts = extractTextLinks(secondaryHtml);

      volumes.push({ volumeId, volumeTitle, descriptionText, popularTexts });
    }

    sections.push({ heading, volumes });
  }

  return { sections };
}

export async function parseTaishoVolume(
  volumeId: string
): Promise<TaishoVolumeText[]> {
  const filePath = path.join(
    getBuddhistDictHtmlDir(),
    "taisho",
    `${volumeId}.html`
  );
  let html: string;
  try {
    html = await fs.readFile(filePath, "utf-8");
  } catch {
    return [];
  }

  const texts: TaishoVolumeText[] = [];
  // Each row: <tr><td>NUMBER</td><td>...<a href='/taisho/tNNNN.html'>TITLE</a>...</td></tr>
  const rowRe = /<tr>\s*<td>(\d+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;
  let m: RegExpExecArray | null;

  while ((m = rowRe.exec(html)) !== null) {
    const number = parseInt(m[1], 10);
    const cellHtml = m[2];
    const linkMatch = cellHtml.match(
      /href=['"]\/taisho\/(t\d+)\.html[^>]*>([\s\S]*?)<\/a>/
    );
    if (linkMatch) {
      texts.push({
        number,
        id: linkMatch[1],
        title: linkMatch[2].replace(/\s+/g, " ").trim(),
      });
    }
  }

  return texts;
}

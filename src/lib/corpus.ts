import fs from "fs/promises";
import path from "path";
import { Storage } from "@google-cloud/storage";

const CORPUS_DIR_BY_THEME: Record<string, string> = {
  chinesenotes: "chinesenotes.com",
  ntireader: "buddhist-dictionary",
  hbreader: "hbreader",
  demo: "chinesenotes.com",
};

function getCorpusRoot(): string {
  const theme = process.env.SITE_THEME ?? "demo";
  const dir = CORPUS_DIR_BY_THEME[theme] ?? CORPUS_DIR_BY_THEME["demo"];
  return path.join(process.cwd(), "..", dir, "data", "corpus");
}

function getGcsBucket(): string {
  const bucket = process.env.TEXT_BUCKET;
  if (!bucket) {
    console.error("TEXT_BUCKET environment variable is not set");
    throw new Error("TEXT_BUCKET environment variable is not set");
  }
  return bucket;
}

const storage = new Storage();

export interface Work {
  id: string;
  titleChinese: string;
  titleEnglish: string;
  author: string;      // period/date, e.g. "Pre-Han", "c. 479–221 BCE"
  description: string;
  csvPath: string;     // relative path from corpus root, e.g. "taisho/t0099.csv"
}

export interface Chapter {
  chapterId: string;
  title: string;
  sourcePath: string; // relative path used as GCS key, e.g. "taisho/t0099_01.txt"
}

function splitTitle(combined: string): { english: string; chinese: string } {
  // Split on the first CJK character or CJK punctuation (《》〈〉)
  const idx = combined.search(/[　-鿿豈-﫿《》]/);
  if (idx === -1) return { english: combined.trim(), chinese: "" };
  return { english: combined.slice(0, idx).trim(), chinese: combined.slice(idx).trim() };
}

export async function getCatalog(): Promise<Work[]> {
  // collections.csv columns (tab-separated):
  // 0: csvFile  1: htmlFile  2: title  3: description  4: introFile
  // 5: corpus   6: language  7: period  8: genre
  const text = await fs.readFile(path.join(getCorpusRoot(), "collections.csv"), "utf-8");
  const works: Work[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length < 4) continue;
    const csvFile = parts[0].trim();
    if (!csvFile.endsWith(".csv")) continue;
    const id = path.basename(csvFile, ".csv");
    const { english, chinese } = splitTitle(parts[2] ?? "");
    const description = (parts[3] ?? "").trim();
    const author = (parts[7] ?? "").trim();
    works.push({ id, titleEnglish: english, titleChinese: chinese, author, description, csvPath: csvFile });
  }
  return works;
}

export async function getWorksForLibrary(_library: string): Promise<Work[]> {
  return getCatalog();
}

export async function getWork(bookId: string): Promise<Work | null> {
  const catalog = await getCatalog();
  return catalog.find((w) => w.id === bookId) ?? null;
}

export async function getChapters(work: Work): Promise<Chapter[]> {
  const csvPath = path.join(getCorpusRoot(), work.csvPath);
  let text: string;
  try {
    text = await fs.readFile(csvPath, "utf-8");
  } catch {
    return [];
  }
  // Chapter CSV columns (tab-separated):
  // 0: sourcePath (e.g. daodejing/daodejing001.txt)  1: htmlPath  2: title
  const chapters: Chapter[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length < 3) continue;
    const sourcePath = parts[0].trim();
    const chapterId = path.basename(sourcePath, ".txt");
    const title = parts[2].trim();
    if (chapterId && title) chapters.push({ chapterId, title, sourcePath });
  }
  return chapters;
}

export async function getChapterTitle(work: Work, chapterId: string): Promise<string | null> {
  const chapters = await getChapters(work);
  return chapters.find((c) => c.chapterId === chapterId)?.title ?? null;
}

export async function getChapterText(sourcePath: string): Promise<string> {
  const [contents] = await storage.bucket(getGcsBucket()).file(sourcePath).download();
  return contents.toString("utf-8");
}

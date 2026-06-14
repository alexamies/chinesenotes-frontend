import fs from "fs/promises";
import path from "path";
import { Storage } from "@google-cloud/storage";

const CORPUS_ROOT = path.join(process.cwd(), "..", "chinesenotes.com", "data", "corpus");
const GCS_BUCKET = "chinesenotes-text";

const storage = new Storage();

export interface Work {
  id: string;
  titleChinese: string;
  titleEnglish: string;
  author: string;      // period/date, e.g. "Pre-Han", "c. 479–221 BCE"
  description: string;
}

export interface Chapter {
  chapterId: string;
  title: string;
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
  const text = await fs.readFile(path.join(CORPUS_ROOT, "collections.csv"), "utf-8");
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
    works.push({ id, titleEnglish: english, titleChinese: chinese, author, description });
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
  // Each book has a corresponding {bookId}.csv listing its chapters
  const csvPath = path.join(CORPUS_ROOT, `${work.id}.csv`);
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
    const chapterId = path.basename(parts[0].trim(), ".txt");
    const title = parts[2].trim();
    if (chapterId && title) chapters.push({ chapterId, title });
  }
  return chapters;
}

export async function getChapterTitle(work: Work, chapterId: string): Promise<string | null> {
  const chapters = await getChapters(work);
  return chapters.find((c) => c.chapterId === chapterId)?.title ?? null;
}

export async function getChapterText(bookId: string, chapterId: string): Promise<string> {
  // Chapter text files live in GCS under {bookId}/{chapterId}.txt
  const gcsPath = `${bookId}/${chapterId}.txt`;
  const [contents] = await storage.bucket(GCS_BUCKET).file(gcsPath).download();
  return contents.toString("utf-8");
}

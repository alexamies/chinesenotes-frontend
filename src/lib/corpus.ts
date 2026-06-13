import fs from "fs/promises";
import path from "path";

const CORPUS_ROOT = path.join(process.cwd(), "corpus");

export interface Work {
  id: string;
  titleChinese: string;
  titleEnglish: string;
  author: string;
  description: string;
  libraries: string[];
  indexFile: string;
}

export interface Chapter {
  chapterId: string;  // e.g. "xiyouji001"
  title: string;      // e.g. "第一回 Chapter 1"
}

export async function getCatalog(): Promise<Work[]> {
  const raw = await fs.readFile(path.join(CORPUS_ROOT, "catalog.json"), "utf-8");
  return JSON.parse(raw) as Work[];
}

export async function getWorksForLibrary(library: string): Promise<Work[]> {
  const catalog = await getCatalog();
  // "demo" theme shows all works
  if (library === "demo") return catalog;
  return catalog.filter((w) => w.libraries.includes(library));
}

export async function getWork(bookId: string): Promise<Work | null> {
  const catalog = await getCatalog();
  return catalog.find((w) => w.id === bookId) ?? null;
}

export async function getChapters(work: Work): Promise<Chapter[]> {
  const csvPath = path.join(CORPUS_ROOT, work.indexFile);
  const text = await fs.readFile(csvPath, "utf-8");
  const chapters: Chapter[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("\t");
    if (parts.length < 3) continue;
    const chapterId = path.basename(parts[0], ".txt");
    const title = parts[2].trim();
    if (chapterId && title) {
      chapters.push({ chapterId, title });
    }
  }
  return chapters;
}

export async function getChapterTitle(work: Work, chapterId: string): Promise<string | null> {
  const chapters = await getChapters(work);
  return chapters.find((c) => c.chapterId === chapterId)?.title ?? null;
}

export async function getChapterText(bookId: string, chapterId: string): Promise<string> {
  const filePath = path.join(CORPUS_ROOT, "content", bookId, `${chapterId}.txt`);
  return fs.readFile(filePath, "utf-8");
}

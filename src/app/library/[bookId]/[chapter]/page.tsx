import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getWork, getChapters, getChapterTitle, getChapterText } from "@/lib/corpus";

export async function generateStaticParams() {
  const catalog = await getCatalog();
  const params: { bookId: string; chapter: string }[] = [];
  for (const work of catalog) {
    const chapters = await getChapters(work);
    for (const { chapterId } of chapters) {
      params.push({ bookId: work.id, chapter: chapterId });
    }
  }
  return params;
}
import { segmentText } from "@/lib/segmentation";
import { lookupTerm } from "@/lib/dictionary";
import ChapterReader from "@/components/ChapterReader";
import type { TextSegment } from "@/components/ChapterReader";

interface PageProps {
  params: Promise<{ bookId: string; chapter: string }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookId, chapter } = await params;

  // Prevent path traversal
  if (!/^[a-z0-9_-]+$/i.test(bookId) || !/^[a-z0-9_-]+$/i.test(chapter)) {
    notFound();
  }

  const work = await getWork(bookId);
  if (!work) notFound();

  let rawText: string;
  try {
    rawText = await getChapterText(bookId, chapter);
  } catch {
    notFound();
  }

  const title = (await getChapterTitle(work, chapter)) ?? chapter;

  const paragraphs: TextSegment[][] = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      segmentText(line, lookupTerm).map((seg) => ({
        text: seg.text,
        matched: seg.entries !== null,
      }))
    );

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/library" className="hover:underline text-primary">
          Library
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/library/${bookId}`} className="hover:underline text-primary">
          {work.titleEnglish}
        </Link>
        <span className="mx-2">›</span>
        <span>{title}</span>
      </nav>

      <ChapterReader title={title} paragraphs={paragraphs} />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork, getChapters, getWorkIntro } from "@/lib/corpus";

// The intro/colophon fragment is fetched from GCS at request time, so this
// page can no longer be prerendered at build time (the build container has
// no TEXT_BUCKET or GCS credentials) — render on demand and cache for 24 hours.
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookPage({ params }: PageProps) {
  const { bookId } = await params;
  const work = await getWork(bookId);
  if (!work) notFound();

  const chapters = await getChapters(work);
  const intro = await getWorkIntro(work);

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/library" prefetch={false} className="hover:underline text-primary">Library</Link>
        <span className="mx-2">›</span>
        <span>{work.titleEnglish}</span>
      </nav>

      <h2 className="text-3xl font-bold text-gray-900 mb-1">{work.titleEnglish}</h2>
      <p className="text-2xl text-gray-600 mb-2">{work.titleChinese}</p>
      <p className="text-sm text-gray-500 mb-8">{work.author} · {work.description}</p>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {chapters.map(({ chapterId, title }) => (
          <Link
            key={chapterId}
            href={`/library/${bookId}/${chapterId}`}
            prefetch={false}
            className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors group"
          >
            <span className="text-base text-gray-800 group-hover:text-primary">{title}</span>
          </Link>
        ))}
      </div>

      {intro && (
        <div
          className="mt-8 bg-white rounded-lg shadow p-6 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      )}
    </main>
  );
}

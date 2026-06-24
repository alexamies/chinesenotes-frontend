import Link from "next/link";
import { getWorksForLibrary } from "@/lib/corpus";
import LibrarySearch from "@/components/LibrarySearch";
import TaishoLibrary from "@/components/TaishoLibrary";

export default async function LibraryPage() {
  const library = process.env.SITE_THEME ?? "demo";
  const isTaisho = library === "ntireader";
  const works = isTaisho ? [] : await getWorksForLibrary(library);

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Library</h2>
      <p className="text-gray-500 mb-8">Browse texts available for reading and vocabulary lookup.</p>

      <LibrarySearch />

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Browse</h3>

      {isTaisho ? (
        <TaishoLibrary />
      ) : works.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-8 py-12 text-center text-gray-400">
          <p className="text-lg font-medium">No texts yet</p>
          <p className="mt-1 text-sm">The library will display a list of classical and modern Chinese texts here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/library/${work.id}`}
              className="flex items-start p-6 hover:bg-gray-50 transition-colors group"
            >
              <div>
                <h3 className="text-xl font-bold text-primary group-hover:underline">{work.titleEnglish}</h3>
                <p className="text-lg text-gray-700">{work.titleChinese}</p>
                <p className="mt-1 text-sm text-gray-500">{work.author} · {work.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

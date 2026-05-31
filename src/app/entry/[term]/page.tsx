import { notFound } from "next/navigation";
import Link from "next/link";
import { lookupTerm } from "@/lib/dictionary";
import EntryDetail from "@/components/EntryDetail";
import DictionaryLookupNav from "@/components/DictionaryLookupNav";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  const entries = lookupTerm(decoded);

  if (!entries) {
    notFound();
  }

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6">
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <DictionaryLookupNav />
      </div>
      <div className="bg-white rounded-lg shadow p-8">
        <div className="mb-4">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Back to search
          </Link>
        </div>
        <EntryDetail entries={entries} />
      </div>
    </main>
  );
}

import type { LookupResult } from "@/types/dictionary";
import EntryDetail from "@/components/EntryDetail";
import EntryList from "@/components/EntryList";

interface DictionaryResultsProps {
  searchText: string | null;
  lookupResult: LookupResult | null;
  errorMessage: string | null;
}

export default function DictionaryResults({ searchText, lookupResult, errorMessage }: DictionaryResultsProps) {
  if (errorMessage) {
    return <div className="mt-8 text-sm text-center text-red-700">{errorMessage}</div>;
  }

  if (searchText === null) {
    return <div className="mt-8 text-sm text-center text-gray-400">Results will appear here.</div>;
  }

  if (searchText === "") {
    return <div className="mt-8 text-sm text-center text-gray-400">Please enter text to look up.</div>;
  }

  if (lookupResult === null) {
    return <div className="mt-8 text-sm text-center text-gray-400">Searching…</div>;
  }

  if (!lookupResult.found) {
    return <div className="mt-8 text-sm text-center text-gray-400">Term not found.</div>;
  }

  const { segments } = lookupResult;
  const anyMatched = segments.some((s) => s.entries !== null);

  if (!anyMatched) {
    return (
      <div className="mt-8 text-sm text-center text-gray-400">
        No matches found for &ldquo;{searchText}&rdquo;.
      </div>
    );
  }

  // Single segment with entries → detailed view
  if (segments.length === 1 && segments[0].entries !== null) {
    return (
      <div className="mt-8">
        <EntryDetail entries={segments[0].entries} />
      </div>
    );
  }

  // Multiple segments → list view
  return <EntryList segments={segments} />;
}

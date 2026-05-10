import type { LookupResult } from "@/types/dictionary";

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
    return <div className="mt-8 text-sm text-center text-gray-400">Please enter text to lookup.</div>;
  }

  if (lookupResult === null) {
    return <div className="mt-8 text-sm text-center text-gray-400">Searching…</div>;
  }

  if (!lookupResult.found) {
    return <div className="mt-8 text-sm text-center text-gray-400">Term not found.</div>;
  }

  const { entry } = lookupResult;

  return (
    <div className="mt-8 text-left">
      <div className="mb-1">
        <span className="text-4xl font-bold text-primary">{entry.s}</span>
        {entry.t !== entry.s && (
          <span className="text-3xl text-gray-400"> ({entry.t})</span>
        )}
      </div>
      <div className="text-base italic text-gray-500 mb-4">{entry.p}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-semibold text-gray-500">English</dt>
        <dd className="text-gray-800">{entry.e}</dd>
        <dt className="font-semibold text-gray-500">Grammar</dt>
        <dd className="text-gray-800">{entry.g}</dd>
        {entry.n && (
          <>
            <dt className="font-semibold text-gray-500">Notes</dt>
            <dd className="text-gray-800">{entry.n}</dd>
          </>
        )}
        {entry.d && (
          <>
            <dt className="font-semibold text-gray-500">Domain</dt>
            <dd className="text-gray-800">{entry.d}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

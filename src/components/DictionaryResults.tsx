import type { LookupResult, DictionaryEntry } from "@/types/dictionary";
import EntryDetail from "@/components/EntryDetail";
import EntryList from "@/components/EntryList";
import TrackedLink from "@/components/TrackedLink";

interface DictionaryResultsProps {
  searchText: string | null;
  lookupResult: LookupResult | null;
  errorMessage: string | null;
}

function ReverseResults({ entries, searchText }: { entries: DictionaryEntry[]; searchText: string }) {
  return (
    <div className="mt-6">
      <table className="w-full text-left border-collapse">
        <tbody>
          {entries.map((entry, i) => {
            const firstSense = entry.e.split(";")[0].trim();
            return (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-2 pr-3 whitespace-nowrap">
                  <span className="text-lg font-bold text-primary">{entry.s}</span>
                  {entry.t !== entry.s && (
                    <span className="text-base text-gray-400 font-normal"> ({entry.t})</span>
                  )}
                  <span className="text-xs italic text-gray-500 ml-2">{entry.p}</span>
                </td>
                <td className="py-2 pr-3 text-sm text-gray-800">
                  {firstSense}
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <TrackedLink
                    href={`/entry/${encodeURIComponent(entry.s)}?from=${encodeURIComponent(searchText)}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Details →
                  </TrackedLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
    return <div className="mt-8 text-sm text-center text-gray-400">No matches found for &ldquo;{searchText}&rdquo;.</div>;
  }

  if (lookupResult.type === 'reverse') {
    return (
      <div className="mt-8">
        <ReverseResults entries={lookupResult.entries} searchText={searchText} />
      </div>
    );
  }

  // Chinese segmentation result
  const { segments } = lookupResult;
  const anyMatched = segments.some((s) => s.entries !== null);

  if (!anyMatched) {
    return (
      <div className="mt-8 text-sm text-center text-gray-400">
        No matches found for &ldquo;{searchText}&rdquo;.
      </div>
    );
  }

  if (segments.length === 1 && segments[0].entries !== null) {
    return (
      <div className="mt-8">
        <EntryDetail entries={segments[0].entries} />
      </div>
    );
  }

  return <EntryList segments={segments} searchText={searchText} />;
}

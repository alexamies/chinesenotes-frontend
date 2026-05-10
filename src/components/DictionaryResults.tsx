import type { LookupResult } from "@/types/dictionary";

interface DictionaryResultsProps {
  searchText: string | null;
  lookupResult: LookupResult | null;
}

export default function DictionaryResults({ searchText, lookupResult }: DictionaryResultsProps) {
  if (searchText === null) {
    return <div className="results-area">Results will appear here.</div>;
  }

  if (searchText === "") {
    return <div className="results-area">Please enter text to lookup.</div>;
  }

  if (lookupResult === null) {
    return <div className="results-area">Searching…</div>;
  }

  if (!lookupResult.found) {
    return <div className="results-area">Term not found.</div>;
  }

  const { entry } = lookupResult;

  return (
    <div className="results-area">
      <div className="result-entry">
        <div className="result-headword">
          <span className="result-simplified">{entry.s}</span>
          {entry.t !== entry.s && (
            <span className="result-traditional"> ({entry.t})</span>
          )}
        </div>
        <div className="result-pinyin">{entry.p}</div>
        <dl className="result-details">
          <dt>Grammar</dt>
          <dd>{entry.g}</dd>
          <dt>English</dt>
          <dd>{entry.e}</dd>
          {entry.n && (
            <>
              <dt>Notes</dt>
              <dd>{entry.n}</dd>
            </>
          )}
          {entry.d && (
            <>
              <dt>Domain</dt>
              <dd>{entry.d}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

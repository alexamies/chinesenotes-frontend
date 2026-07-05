"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContainingTermResult } from "@/app/api/containing-terms/route";

function renderHighlighted(text: string, term: string) {
  const idx = text.indexOf(term);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-red-600 font-medium">{term}</span>
      {text.slice(idx + term.length)}
    </>
  );
}

interface ContainingStringActionProps {
  term: string; // the full search string, which may span multiple dictionary entries
}

export default function ContainingStringAction({ term }: ContainingStringActionProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContainingTermResult[] | null>(null);

  async function handleClick() {
    setExpanded(true);
    if (results !== null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/containing-terms?term=${encodeURIComponent(term)}`);
      if (!res.ok) {
        setError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      setResults(data.terms ?? []);
    } catch {
      setError("Search unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      {!expanded ? (
        <button
          onClick={handleClick}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Terms containing this string
        </button>
      ) : (
        <span className="text-sm font-semibold text-gray-800">Terms containing this string</span>
      )}

      {expanded && (
        <div className="mt-3">
          {loading && <p className="text-sm text-gray-500">Searching…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {results !== null && (
            results.length === 0 ? (
              <p className="text-sm text-gray-500">No terms found containing this string.</p>
            ) : (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-100">
                {results.map((ct, i) => (
                  <div key={i} className="px-4 py-2">
                    <Link
                      href={`/entry/${encodeURIComponent(ct.s)}`}
                      className="text-base font-semibold text-primary hover:underline"
                    >
                      {renderHighlighted(ct.s, term)}
                      {ct.t !== ct.s && (
                        <span className="text-gray-500 font-normal">
                          {" ("}
                          {renderHighlighted(ct.t, term)}
                          {")"}
                        </span>
                      )}
                    </Link>
                    {ct.english.length > 0 && (
                      <p className="text-sm text-gray-700 mt-0.5">
                        {ct.english.join("; ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

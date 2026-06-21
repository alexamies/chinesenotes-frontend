"use client";

import { useState } from "react";
import Link from "next/link";

interface MatchDetails {
  Snippet: string;
  LongestMatch: string;
  ExactMatch: boolean;
}

interface SearchDocument {
  GlossFile: string;
  Title: string;
  CollectionFile: string;
  CollectionTitle: string;
  MatchDetails: MatchDetails;
}

function glossFileToChapterPath(glossFile: string): string | null {
  const parts = glossFile.split("/");
  if (parts.length === 2) {
    const bookId = parts[0];
    const chapterId = parts[1].replace(/\.html$/, "");
    if (bookId && chapterId) return `/library/${bookId}/${chapterId}`;
  }
  return null;
}

function collectionFileToBookPath(collectionFile: string): string | null {
  if (!collectionFile) return null;
  const bookId = collectionFile.replace(/\.html$/, "");
  return bookId ? `/library/${bookId}` : null;
}

function renderSnippet(snippet: string, longestMatch: string) {
  if (!longestMatch) return <>{snippet}</>;
  const idx = snippet.indexOf(longestMatch);
  if (idx === -1) return <>{snippet}</>;
  return (
    <>
      {snippet.slice(0, idx)}
      <span className="text-red-600 font-medium">{longestMatch}</span>
      {snippet.slice(idx + longestMatch.length)}
    </>
  );
}

export default function TermTexts({ term }: { term: string }) {
  const [results, setResults] = useState<SearchDocument[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/fulltext?query=${encodeURIComponent(term)}`);
      if (!res.ok) {
        setError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      const exactMatches = (data.Documents ?? []).filter(
        (doc: SearchDocument) => doc.MatchDetails?.ExactMatch === true
      );
      setResults(exactMatches);
    } catch {
      setError("Search unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (results === null && !loading && !error) {
    return (
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSearch}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Texts containing the term
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Texts containing the term
      </h3>

      {loading && <p className="text-sm text-gray-500">Searching…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {results !== null && (
        results.length === 0 ? (
          <p className="text-sm text-gray-500">No texts found containing this term.</p>
        ) : (
          <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-100">
            {results.map((doc, i) => {
              const chapterPath = glossFileToChapterPath(doc.GlossFile);
              const bookPath = collectionFileToBookPath(doc.CollectionFile);
              const snippet = doc.MatchDetails?.Snippet?.trim().replace(/\n+/g, " ");
              return (
                <div key={i} className="p-4">
                  {chapterPath ? (
                    <Link href={chapterPath} className="text-sm font-semibold text-primary hover:underline">
                      {doc.Title}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">{doc.Title}</span>
                  )}
                  {doc.CollectionTitle && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {bookPath ? (
                        <Link href={bookPath} className="hover:underline hover:text-primary">
                          {doc.CollectionTitle}
                        </Link>
                      ) : (
                        doc.CollectionTitle
                      )}
                    </p>
                  )}
                  {snippet && (
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed line-clamp-3">
                      {renderSnippet(snippet, doc.MatchDetails?.LongestMatch ?? "")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

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
  ContainsTerms: string[];
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

export default function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocument[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/fulltext?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        setError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      setResults(data.Documents ?? []);
    } catch {
      setError("Search unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Full Text Search</h3>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search library texts…"
          aria-label="Full text search query"
          className="flex-1 px-3 py-2 border border-gray-300 rounded outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="font-semibold px-6 py-2 bg-primary text-white rounded hover:brightness-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">No results found.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                {results.map((doc, i) => {
                  const chapterPath = glossFileToChapterPath(doc.GlossFile);
                  const bookPath = collectionFileToBookPath(doc.CollectionFile);
                  const snippet = doc.MatchDetails?.Snippet?.trim().replace(/\n+/g, " ");
                  return (
                    <div key={i} className="p-5">
                      {chapterPath ? (
                        <Link href={chapterPath} className="text-base font-semibold text-primary hover:underline">
                          {doc.Title}
                        </Link>
                      ) : (
                        <span className="text-base font-semibold text-gray-900">{doc.Title}</span>
                      )}
                      {doc.CollectionTitle && (
                        <p className="text-sm text-gray-500 mt-0.5">
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
                      {doc.ContainsTerms?.length > 0 && (
                        <p className="mt-1.5 text-xs text-gray-400">
                          Matched: {doc.ContainsTerms.join("、")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

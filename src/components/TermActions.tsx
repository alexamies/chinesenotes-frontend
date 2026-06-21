"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContainingTermResult } from "@/app/api/containing-terms/route";

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

interface TermActionsProps {
  term: string;       // simplified Chinese (for containing-terms lookup)
  textsQuery: string; // term used for full-text search (may be traditional)
}

export default function TermActions({ term, textsQuery }: TermActionsProps) {
  const [textsExpanded, setTextsExpanded] = useState(false);
  const [textsLoading, setTextsLoading] = useState(false);
  const [textsError, setTextsError] = useState<string | null>(null);
  const [textsResults, setTextsResults] = useState<SearchDocument[] | null>(null);

  const [containingExpanded, setContainingExpanded] = useState(false);
  const [containingLoading, setContainingLoading] = useState(false);
  const [containingError, setContainingError] = useState<string | null>(null);
  const [containingTerms, setContainingTerms] = useState<ContainingTermResult[] | null>(null);

  async function handleTextsClick() {
    setTextsExpanded(true);
    if (textsResults !== null || textsLoading) return;
    setTextsLoading(true);
    setTextsError(null);
    try {
      const res = await fetch(`/api/fulltext?query=${encodeURIComponent(textsQuery)}`);
      if (!res.ok) {
        setTextsError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      const exactMatches = (data.Documents ?? []).filter(
        (doc: SearchDocument) => doc.MatchDetails?.ExactMatch === true
      );
      setTextsResults(exactMatches);
    } catch {
      setTextsError("Search unavailable. Please try again later.");
    } finally {
      setTextsLoading(false);
    }
  }

  async function handleContainingClick() {
    setContainingExpanded(true);
    if (containingTerms !== null || containingLoading) return;
    setContainingLoading(true);
    setContainingError(null);
    try {
      const res = await fetch(`/api/containing-terms?term=${encodeURIComponent(term)}`);
      if (!res.ok) {
        setContainingError("Search failed. Please try again.");
        return;
      }
      const data = await res.json();
      setContainingTerms(data.terms ?? []);
    } catch {
      setContainingError("Search unavailable. Please try again later.");
    } finally {
      setContainingLoading(false);
    }
  }

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {!textsExpanded ? (
          <button
            onClick={handleTextsClick}
            className="text-primary hover:underline cursor-pointer"
          >
            Texts containing the term
          </button>
        ) : (
          <span className="font-semibold text-gray-800">Texts containing the term</span>
        )}
        <span className="text-gray-400">|</span>
        {!containingExpanded ? (
          <button
            onClick={handleContainingClick}
            className="text-primary hover:underline cursor-pointer"
          >
            Other terms containing this term
          </button>
        ) : (
          <span className="font-semibold text-gray-800">Other terms containing this term</span>
        )}
      </div>

      {textsExpanded && (
        <div className="mt-3">
          {textsLoading && <p className="text-sm text-gray-500">Searching…</p>}
          {textsError && <p className="text-sm text-red-600">{textsError}</p>}
          {textsResults !== null && (
            textsResults.length === 0 ? (
              <p className="text-sm text-gray-500">No texts found containing this term.</p>
            ) : (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-100">
                {textsResults.map((doc, i) => {
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
      )}

      {containingExpanded && (
        <div className="mt-3">
          {containingLoading && <p className="text-sm text-gray-500">Searching…</p>}
          {containingError && <p className="text-sm text-red-600">{containingError}</p>}
          {containingTerms !== null && (
            containingTerms.length === 0 ? (
              <p className="text-sm text-gray-500">No other terms found containing this term.</p>
            ) : (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 border border-gray-100">
                {containingTerms.map((ct, i) => (
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

"use client";

import { useState } from "react";
import EntryDetail from "@/components/EntryDetail";
import type { DictionaryEntry, LookupResult } from "@/types/dictionary";
import { getRecaptchaToken, isKnownOverThreshold, updateInteractionCount } from "@/lib/recaptcha";

export interface TextSegment {
  text: string;
  matched: boolean;
}

interface ChapterReaderProps {
  title: string;
  paragraphs: TextSegment[][];
}

async function fetchLookup(text: string, recaptchaToken: string | null): Promise<Response> {
  let url = `/api/lookup?term=${encodeURIComponent(text)}`;
  if (recaptchaToken) {
    url += `&recaptchaToken=${encodeURIComponent(recaptchaToken)}&recaptchaAction=lookup`;
  }
  return fetch(url);
}

export default function ChapterReader({ title, paragraphs }: ChapterReaderProps) {
  const [activeText, setActiveText] = useState<string | null>(null);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleClick(text: string) {
    if (activeText === text) {
      setActiveText(null);
      setEntries([]);
      return;
    }
    setActiveText(text);
    setEntries([]);
    setLoading(true);

    try {
      const token = isKnownOverThreshold() ? await getRecaptchaToken("lookup") : null;
      let res = await fetchLookup(text, token);

      if (res.status === 403 && !token) {
        const retryToken = await getRecaptchaToken("lookup");
        if (retryToken) res = await fetchLookup(text, retryToken);
      }

      if (res.ok) {
        const data: LookupResult = await res.json();
        if (data.interactionCount !== undefined) {
          updateInteractionCount(data.interactionCount);
        }
        if (data.found) {
          setEntries(data.segments.flatMap((s) => s.entries ?? []));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setActiveText(null);
    setEntries([]);
  }

  return (
    <div className="pb-64">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>

      <div className="bg-white rounded-lg shadow p-6 text-lg leading-loose">
        {paragraphs.map((paragraph, pi) => (
          <p key={pi} className="mb-4">
            {paragraph.map((seg, si) =>
              seg.matched ? (
                <span
                  key={si}
                  onClick={() => handleClick(seg.text)}
                  className={`cursor-pointer transition-colors ${
                    activeText === seg.text
                      ? "text-primary underline"
                      : "text-gray-800 hover:text-primary hover:underline"
                  }`}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={si} className="text-gray-600">
                  {seg.text}
                </span>
              )
            )}
          </p>
        ))}
      </div>

      {activeText && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Dictionary</span>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close definition panel"
              >
                ×
              </button>
            </div>
            {loading && <p className="text-sm text-gray-400">Looking up…</p>}
            {!loading && entries.length > 0 && <EntryDetail entries={entries} />}
            {!loading && entries.length === 0 && activeText && (
              <p className="text-sm text-gray-400">No entry found for &ldquo;{activeText}&rdquo;.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

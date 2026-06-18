"use client";

import { useState, useEffect } from "react";
import DictionaryLookup from "@/components/DictionaryLookup";
import DictionaryResults from "@/components/DictionaryResults";
import type { LookupResult } from "@/types/dictionary";
import { getRecaptchaToken, isKnownOverThreshold, updateInteractionCount } from "@/lib/recaptcha";

interface DictionaryAppProps {
  initialQuery?: string;
}

async function fetchLookup(term: string, recaptchaToken: string | null): Promise<Response> {
  let url = `/api/lookup?term=${encodeURIComponent(term)}`;
  if (recaptchaToken) {
    url += `&recaptchaToken=${encodeURIComponent(recaptchaToken)}&recaptchaAction=lookup`;
  }
  return fetch(url);
}

export default function DictionaryApp({ initialQuery }: DictionaryAppProps) {
  const [searchText, setSearchText] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch(term: string) {
    setSearchText(term);
    setLookupResult(null);
    setErrorMessage(null);

    if (!term) return;

    try {
      // Pre-fetch a token when we already know we're over the threshold.
      const token = isKnownOverThreshold() ? await getRecaptchaToken("lookup") : null;
      let response = await fetchLookup(term, token);

      // The server enforces the threshold and returns 403 {requiresRecaptcha: true}
      // when the count has crossed over but the client didn't know yet. Retry once.
      if (response.status === 403 && !token) {
        const retryToken = await getRecaptchaToken("lookup");
        if (!retryToken) {
          console.warn("[DictionaryApp] 403 retry skipped: getRecaptchaToken returned null");
        }
        if (retryToken) {
          response = await fetchLookup(term, retryToken);
        }
      }

      if (response.status === 401) {
        setErrorMessage("Session expired. Please refresh the page.");
        return;
      }
      if (response.status === 403) {
        let body: unknown;
        try { body = await response.clone().json(); } catch { body = null; }
        console.warn("[DictionaryApp] Security check failed (403)", {
          hadInitialToken: !!token,
          responseBody: body,
        });
        setErrorMessage("Security check failed. Please try again.");
        return;
      }

      const data: LookupResult = await response.json();
      if (data.interactionCount !== undefined) {
        updateInteractionCount(data.interactionCount);
      }
      setLookupResult(data);
    } catch (err) {
      console.error("Dictionary lookup failed:", err);
      setErrorMessage("An error occurred while looking up the term. Please try again.");
    }
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-base font-medium text-gray-500 mb-4">Enter a Chinese word or phrase to look up its English meaning.</h2>

      <DictionaryLookup initialValue={initialQuery ?? ""} onSearchTextChange={handleSearch} />

      <DictionaryResults
        searchText={searchText}
        lookupResult={lookupResult}
        errorMessage={errorMessage}
      />
    </div>
  );
}

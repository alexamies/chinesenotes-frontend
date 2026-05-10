"use client";

import { useState } from "react";
import DictionaryLookup from "@/components/DictionaryLookup";
import DictionaryResults from "@/components/DictionaryResults";
import type { LookupResult } from "@/types/dictionary";

export default function DictionaryApp() {
  const [searchText, setSearchText] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch(term: string) {
    setSearchText(term);
    setLookupResult(null);
    setErrorMessage(null);

    if (!term) return;

    try {
      const response = await fetch(`/api/lookup?term=${encodeURIComponent(term)}`);
      const data: LookupResult = await response.json();
      setLookupResult(data);
    } catch (err) {
      console.error("Dictionary lookup failed:", err);
      setErrorMessage("An error occurred while looking up the term. Please try again.");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-base font-medium text-gray-500 mb-4">Enter a Chinese word or phrase to look up its English meaning.</h2>

      <DictionaryLookup onSearchTextChange={handleSearch} />

      <DictionaryResults
        searchText={searchText}
        lookupResult={lookupResult}
        errorMessage={errorMessage}
      />
    </div>
  );
}

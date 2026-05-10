"use client";

import { useState } from "react";
import DictionaryLookup from "@/components/DictionaryLookup";
import DictionaryResults from "@/components/DictionaryResults";
import type { LookupResult } from "@/types/dictionary";

export default function DictionaryApp() {
  const [searchText, setSearchText] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  async function handleSearch(term: string) {
    setSearchText(term);
    setLookupResult(null);

    if (!term) return;

    try {
      const response = await fetch(`/api/lookup?term=${encodeURIComponent(term)}`);
      const data: LookupResult = await response.json();
      setLookupResult(data);
    } catch {
      setLookupResult({ found: false });
    }
  }

  return (
    <div className="search-card">
      <h2>Enter a Chinese word or phrase to look up its English meaning.</h2>

      <DictionaryLookup onSearchTextChange={handleSearch} />

      <DictionaryResults searchText={searchText} lookupResult={lookupResult} />
    </div>
  );
}

"use client";

import { useState } from "react";

interface DictionaryLookupProps {
  onSearchTextChange: (value: string) => void;
}

export default function DictionaryLookup({ onSearchTextChange }: DictionaryLookupProps) {
  const [inputText, setInputText] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearchTextChange(inputText);
  }

  return (
    <form className="search-row" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-input"
        placeholder="中文"
        aria-label="Chinese term"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button type="submit" className="find-button">
        Find
      </button>
    </form>
  );
}

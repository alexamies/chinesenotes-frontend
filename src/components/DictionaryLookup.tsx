"use client";

import { useState } from "react";

interface DictionaryLookupProps {
  onSearchTextChange: (value: string) => void;
  initialValue?: string;
}

export default function DictionaryLookup({ onSearchTextChange, initialValue = "" }: DictionaryLookupProps) {
  const [inputText, setInputText] = useState(initialValue);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearchTextChange(inputText);
  }

  return (
    <form className="flex gap-3" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flex-1 text-xl px-3 py-2 border border-gray-300 rounded outline-none focus:border-primary transition-colors"
        placeholder="中文 / English / pinyin"
        aria-label="Chinese characters, English, or pinyin"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button type="submit" className="font-semibold px-6 py-2 bg-primary text-white rounded hover:brightness-90 transition-colors cursor-pointer">
        Find
      </button>
    </form>
  );
}

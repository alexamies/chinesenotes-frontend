import fs from "fs";
import path from "path";
import type { DictionaryEntry } from "@/types/dictionary";

let index: Map<string, DictionaryEntry> | null = null;

function getIndex(): Map<string, DictionaryEntry> {
  if (index !== null) return index;

  const filePath = path.join(process.cwd(), "data", "dictionary.json");
  const entries = JSON.parse(fs.readFileSync(filePath, "utf-8")) as DictionaryEntry[];

  index = new Map();
  for (const entry of entries) {
    index.set(entry.s, entry);
    if (entry.t !== entry.s) {
      index.set(entry.t, entry);
    }
  }

  return index;
}

export function lookupTerm(term: string): DictionaryEntry | undefined {
  return getIndex().get(term);
}

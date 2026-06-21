import fs from "fs";
import path from "path";
import type { DictionaryEntry } from "@/types/dictionary";

let index: Map<string, DictionaryEntry[]> | null = null;
let substringIndex: Map<string, string[]> | null = null;

function getIndex(): Map<string, DictionaryEntry[]> {
  if (index !== null) return index;

  const filePath = path.join(process.cwd(), "data", "dictionary.json");
  const entries = JSON.parse(fs.readFileSync(filePath, "utf-8")) as DictionaryEntry[];

  index = new Map();
  for (const entry of entries) {
    const addEntry = (key: string) => {
      const existing = index!.get(key);
      if (existing) {
        existing.push(entry);
      } else {
        index!.set(key, [entry]);
      }
    };
    addEntry(entry.s);
    if (entry.t !== entry.s) {
      addEntry(entry.t);
    }
  }

  return index;
}

export function lookupTerm(term: string): DictionaryEntry[] | undefined {
  return getIndex().get(term);
}

function getSubstringIndex(): Map<string, string[]> {
  if (substringIndex !== null) return substringIndex;
  const filePath = path.join(process.cwd(), "data", "substring-index.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string[]>;
  substringIndex = new Map(Object.entries(raw));
  return substringIndex;
}

export function findContainingTerms(term: string): string[] {
  return getSubstringIndex().get(term) ?? [];
}

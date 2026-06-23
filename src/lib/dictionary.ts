import fs from "fs";
import path from "path";
import type { DictionaryEntry } from "@/types/dictionary";

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'as', 'into',
]);

// Remove tone diacritics and spaces from pinyin for accent-insensitive matching.
function normalizePinyin(pinyin: string): string {
  return pinyin
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics (tone marks)
    .replace(/\s+/g, '');
}

let chineseIndex: Map<string, DictionaryEntry[]> | null = null;
let englishIndex: Map<string, DictionaryEntry[]> | null = null;
let pinyinIndex: Map<string, DictionaryEntry[]> | null = null;

function addToMap(
  map: Map<string, DictionaryEntry[]>,
  key: string,
  entry: DictionaryEntry,
  dedupByH = false,
): void {
  const existing = map.get(key);
  if (existing) {
    if (!dedupByH || !existing.some((e) => e.h === entry.h)) {
      existing.push(entry);
    }
  } else {
    map.set(key, [entry]);
  }
}

function buildAllIndexes(): void {
  if (chineseIndex !== null) return;

  const filePath = path.join(process.cwd(), "data", "dictionary.json");
  const entries = JSON.parse(fs.readFileSync(filePath, "utf-8")) as DictionaryEntry[];

  chineseIndex = new Map();
  englishIndex = new Map();
  pinyinIndex = new Map();

  for (const entry of entries) {
    // Chinese: simplified and traditional
    addToMap(chineseIndex, entry.s, entry);
    if (entry.t !== entry.s) {
      addToMap(chineseIndex, entry.t, entry);
    }

    // English: split by ';', strip stop words, index the whole remaining phrase
    for (const equiv of entry.e.split(';')) {
      const key = equiv
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0 && !ENGLISH_STOP_WORDS.has(w))
        .join(' ');
      if (key) {
        addToMap(englishIndex, key, entry, true);
      }
    }

    // Pinyin: exact match on accent-stripped, space-stripped syllable(s)
    const pKey = normalizePinyin(entry.p);
    if (pKey) {
      addToMap(pinyinIndex, pKey, entry, true);
    }
  }
}

function getChineseIndex(): Map<string, DictionaryEntry[]> {
  buildAllIndexes();
  return chineseIndex!;
}

function getEnglishIndex(): Map<string, DictionaryEntry[]> {
  buildAllIndexes();
  return englishIndex!;
}

function getPinyinIndex(): Map<string, DictionaryEntry[]> {
  buildAllIndexes();
  return pinyinIndex!;
}

export function lookupTerm(term: string): DictionaryEntry[] | undefined {
  return getChineseIndex().get(term);
}

let substringIndex: Map<string, string[]> | null = null;

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

// CJK Unified Ideographs + Extension A + Compatibility Ideographs
export function detectInputType(term: string): 'chinese' | 'nonChinese' {
  return /[一-鿿㐀-䶿豈-﫿]/.test(term) ? 'chinese' : 'nonChinese';
}

export function reverseLookup(term: string): DictionaryEntry[] {
  const results: DictionaryEntry[] = [];
  const seen = new Set<string>();

  const collect = (entries: DictionaryEntry[] | undefined) => {
    for (const entry of entries ?? []) {
      if (!seen.has(entry.h)) {
        seen.add(entry.h);
        results.push(entry);
      }
    }
  };

  // English: strip stop words from the query, look up the whole resulting phrase
  const englishKey = term
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !ENGLISH_STOP_WORDS.has(w))
    .join(' ');

  if (englishKey) {
    collect(getEnglishIndex().get(englishKey));
  }

  // Pinyin: exact match on normalized (tone-stripped, space-stripped) form
  const pKey = normalizePinyin(term);
  if (pKey) {
    collect(getPinyinIndex().get(pKey));
  }

  return results;
}

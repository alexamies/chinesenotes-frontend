export interface DictionaryEntry {
  s: string; // simplified Chinese
  t: string; // traditional Chinese
  p: string; // Hanyu pinyin
  e: string; // English definition
  g: string; // grammar
  h: string; // headword number
  n?: string; // notes
  d?: string; // domain
}

export type LookupResult =
  | { found: true; entry: DictionaryEntry }
  | { found: false };

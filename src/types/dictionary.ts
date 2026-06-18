export interface DictionaryEntry {
  s: string; // simplified Chinese
  t: string; // traditional Chinese
  p: string; // Hanyu pinyin
  e: string; // English definition
  g: string; // grammar
  h: string; // headword number
  n?: string; // notes
  d?: string; // domain
  sd?: string; // subdomain
}

export interface Segment {
  text: string;
  entries: DictionaryEntry[] | null; // null if not found in dictionary
}

export type LookupResult =
  | { found: true; segments: Segment[]; interactionCount: number }
  | { found: false; interactionCount?: number };

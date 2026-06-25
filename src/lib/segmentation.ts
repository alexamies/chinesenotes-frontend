import type { DictionaryEntry, Segment } from "@/types/dictionary";

/**
 * Greedy longest-match-first segmentation (bin packing).
 * At each position tries the longest possible substring first, falling back
 * to shorter substrings. This minimises the number of segments and favours
 * longer dictionary entries over shorter ones.
 *
 * The `lookup` parameter is injected so the function is unit-testable without
 * hitting the filesystem.
 */
export function segmentText(
  text: string,
  lookup: (term: string) => DictionaryEntry[] | undefined
): Segment[] {
  const segments: Segment[] = [];
  let j = 0;

  while (j < text.length) {
    // Non-CJK characters (punctuation, ASCII, etc.) can never match a dictionary
    // entry, so skip the greedy substring search and emit them immediately.
    if (!/[一-鿿㐀-䶿豈-﫿]/.test(text[j])) {
      segments.push({ text: text[j], entries: null });
      j++;
      continue;
    }

    let k = text.length - j;

    while (k > 0) {
      const chars = text.substring(j, j + k);
      const entries = lookup(chars);

      if (entries) {
        segments.push({ text: chars, entries });
        j += chars.length;
        break;
      }

      if (k === 1) {
        // Single character with no dictionary entry — include as unmatched
        segments.push({ text: chars, entries: null });
        j++;
        break;
      }

      k--;
    }
  }

  return segments;
}

import type { DictionaryEntry, Segment } from "@/types/dictionary";

const CJK_RE = /[一-鿿㐀-䶿豈-﫿]/;

function isCJK(ch: string): boolean {
  return CJK_RE.test(ch);
}

/**
 * Splits text into runs of consecutive CJK characters and runs of
 * consecutive non-CJK characters (punctuation, whitespace, ASCII, etc).
 * Mirrors the reference Segment() in
 * https://github.com/alexamies/chinesenotes-go/blob/master/tokenizer/segmenter.go
 */
function splitIntoRuns(text: string): { text: string; cjk: boolean }[] {
  const runs: { text: string; cjk: boolean }[] = [];
  let start = 0;

  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || isCJK(text[i]) !== isCJK(text[start])) {
      runs.push({ text: text.substring(start, i), cjk: isCJK(text[start]) });
      start = i;
    }
  }

  return runs;
}

/**
 * Greedy longest-match-first tokenization, scanning left to right: at each
 * position tries the longest possible substring first, falling back to
 * shorter substrings.
 */
function greedyLtoR(
  chars: string[],
  lookup: (term: string) => DictionaryEntry[] | undefined
): Segment[] {
  const tokens: Segment[] = [];
  let i = 0;

  while (i < chars.length) {
    let k = chars.length - i;

    while (k > 0) {
      const text = chars.slice(i, i + k).join("");
      const entries = lookup(text);

      if (entries) {
        tokens.push({ text, entries });
        i += k;
        break;
      }

      if (k === 1) {
        tokens.push({ text, entries: null });
        i++;
        break;
      }

      k--;
    }
  }

  return tokens;
}

/**
 * Greedy longest-match-first tokenization, scanning right to left. Compared
 * against the left-to-right result so that a longer dictionary entry is not
 * missed just because a shorter entry earlier in the run matched first when
 * scanning left to right.
 */
function greedyRtoL(
  chars: string[],
  lookup: (term: string) => DictionaryEntry[] | undefined
): Segment[] {
  const tokens: Segment[] = [];
  let i = chars.length;

  while (i > 0) {
    let k = i;

    while (k > 0) {
      const text = chars.slice(i - k, i).join("");
      const entries = lookup(text);

      if (entries) {
        tokens.unshift({ text, entries });
        i -= k;
        break;
      }

      if (k === 1) {
        tokens.unshift({ text, entries: null });
        i--;
        break;
      }

      k--;
    }
  }

  return tokens;
}

/**
 * Tokenizes a run of consecutive CJK characters into dictionary headwords
 * using bidirectional greedy matching (bin packing): tokenizes both left-to-
 * right and right-to-left, then keeps whichever produced fewer, longer
 * tokens. This resolves cases where a left-to-right scan greedily consumes a
 * shorter match early in the run, masking a longer dictionary entry that
 * starts a character or two later.
 */
function tokenizeRun(
  run: string,
  lookup: (term: string) => DictionaryEntry[] | undefined
): Segment[] {
  const chars = Array.from(run);
  const ltor = greedyLtoR(chars, lookup);
  const rtol = greedyRtoL(chars, lookup);
  return rtol.length < ltor.length ? rtol : ltor;
}

/**
 * Segments text into runs of Chinese separated by punctuation or non-Chinese
 * text, then tokenizes each Chinese run into dictionary headwords.
 *
 * The `lookup` parameter is injected so the function is unit-testable without
 * hitting the filesystem.
 */
export function segmentText(
  text: string,
  lookup: (term: string) => DictionaryEntry[] | undefined
): Segment[] {
  const segments: Segment[] = [];

  for (const run of splitIntoRuns(text)) {
    if (run.cjk) {
      segments.push(...tokenizeRun(run.text, lookup));
    } else {
      segments.push({ text: run.text, entries: null });
    }
  }

  return segments;
}

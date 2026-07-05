import { describe, it, expect } from "vitest";
import { segmentText } from "./segmentation";
import type { DictionaryEntry } from "@/types/dictionary";

function entry(s: string, p: string, e: string): DictionaryEntry {
  return { s, t: s, p, e, g: "noun", h: "0" };
}

const dict = new Map<string, DictionaryEntry[]>([
  ["教育", [entry("教育", "jiào yù", "education")]],
  ["機構", [entry("機構", "jī gòu", "organization")]],
  ["教", [entry("教", "jiào", "to teach")]],
  ["育", [entry("育", "yù", "to raise")]],
  ["學校", [entry("學校", "xué xiào", "school")]],
  ["中", [entry("中", "zhōng", "middle")]],
  ["文", [entry("文", "wén", "language")]],
  ["中文", [entry("中文", "zhōng wén", "Chinese language")]],
]);

const lookup = (term: string) => dict.get(term);

describe("segmentText", () => {
  it("segments 教育機構 into [教育, 機構]", () => {
    const result = segmentText("教育機構", lookup);
    expect(result.map((s) => s.text)).toEqual(["教育", "機構"]);
    expect(result[0].entries).not.toBeNull();
    expect(result[1].entries).not.toBeNull();
  });

  it("returns a single segment for a known two-character term", () => {
    const result = segmentText("教育", lookup);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("教育");
    expect(result[0].entries).not.toBeNull();
  });

  it("prefers longer match over two shorter ones (教育 over 教 + 育)", () => {
    const result = segmentText("教育", lookup);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("教育");
  });

  it("falls back to individual characters when only single chars are in dict", () => {
    const result = segmentText("中文", lookup);
    // 中文 is in dict as a compound — should be one segment
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("中文");
  });

  it("handles a single known character", () => {
    const result = segmentText("中", lookup);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("中");
    expect(result[0].entries).not.toBeNull();
  });

  it("records null entries for characters not in dictionary", () => {
    const result = segmentText("X", lookup);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("X");
    expect(result[0].entries).toBeNull();
  });

  it("handles mixed known and unknown characters", () => {
    const result = segmentText("教X育", lookup);
    expect(result.map((s) => s.text)).toEqual(["教", "X", "育"]);
    expect(result[0].entries).not.toBeNull();
    expect(result[1].entries).toBeNull();
    expect(result[2].entries).not.toBeNull();
  });

  it("returns empty array for empty input", () => {
    expect(segmentText("", lookup)).toEqual([]);
  });

  it("segments a three-term phrase correctly", () => {
    const result = segmentText("教育學校機構", lookup);
    expect(result.map((s) => s.text)).toEqual(["教育", "學校", "機構"]);
  });

  it("groups a run of punctuation/non-CJK characters into a single segment", () => {
    const result = segmentText("[0064b01] 教育。", lookup);
    expect(result.map((s) => s.text)).toEqual(["[0064b01] ", "教育", "。"]);
  });

  it("prefers a longer word starting later over a shorter greedy match at the start", () => {
    // 僧伽提和 is a four-character headword; a naive left-to-right greedy
    // scan matches 請僧 first (if present) and never finds 僧伽提和.
    const bimm = new Map<string, DictionaryEntry[]>([
      ["請", [entry("請", "qǐng", "please")]],
      ["僧", [entry("僧", "sēng", "monk")]],
      ["伽", [entry("伽", "jiā", "(transliteration)")]],
      ["提", [entry("提", "tí", "to lift")]],
      ["和", [entry("和", "hé", "and")]],
      ["請僧", [entry("請僧", "qǐng sēng", "to invite a monk")]],
      ["僧伽提和", [entry("僧伽提和", "Sēngjiātíhé", "Samghadeva")]],
    ]);
    const bimmLookup = (term: string) => bimm.get(term);
    const result = segmentText("請僧伽提和", bimmLookup);
    expect(result.map((s) => s.text)).toEqual(["請", "僧伽提和"]);
  });
});

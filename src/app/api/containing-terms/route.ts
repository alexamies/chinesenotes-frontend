import { NextRequest, NextResponse } from "next/server";
import { findContainingTerms, lookupTerm } from "@/lib/dictionary";

export interface ContainingTermResult {
  s: string;
  t: string;
  english: string[];
}

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");
  if (!term || !term.trim()) {
    return NextResponse.json({ error: "term parameter required" }, { status: 400 });
  }

  const rawTerms = findContainingTerms(term.trim());

  // Look up each term, deduplicate by simplified form (handles simplified+traditional duplicates)
  const seen = new Set<string>();
  const results: ContainingTermResult[] = [];

  for (const ct of rawTerms) {
    const entries = lookupTerm(ct);
    if (!entries || entries.length === 0) continue;

    const head = entries[0];
    if (seen.has(head.s)) continue;
    seen.add(head.s);

    const english = [...new Set(entries.map((e) => e.e))];
    results.push({ s: head.s, t: head.t, english });
  }

  return NextResponse.json({ terms: results });
}

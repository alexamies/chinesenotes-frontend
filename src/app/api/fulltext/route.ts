import { NextRequest, NextResponse } from "next/server";

const FULLTEXT_API = "http://chinesenotes.com/findadvanced/";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query parameter required" }, { status: 400 });
  }

  const url = `${FULLTEXT_API}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream error" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "search unavailable" }, { status: 503 });
  }
}

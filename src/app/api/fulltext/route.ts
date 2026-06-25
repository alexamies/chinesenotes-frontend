import { NextRequest, NextResponse } from "next/server";

const SITE_THEME_DEFAULTS: Record<string, string> = {
  chinesenotes: "http://chinesenotes.com/findadvanced/",
  ntireader:    "http://ntireader.org/findadvanced/",
  hbreader:     "http://hbreader.org/findadvanced/",
};

function getFulltextApiUrl(): string {
  if (process.env.FULLTEXT_API_URL) return process.env.FULLTEXT_API_URL;
  const theme = process.env.SITE_THEME ?? "chinesenotes";
  const url = SITE_THEME_DEFAULTS[theme] ?? SITE_THEME_DEFAULTS["chinesenotes"];
  console.warn(`FULLTEXT_API_URL not set; using default for theme '${theme}': ${url}`);
  return url;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query parameter required" }, { status: 400 });
  }

  const url = `${getFulltextApiUrl()}?query=${encodeURIComponent(query)}`;
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

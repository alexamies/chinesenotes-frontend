import { NextRequest, NextResponse } from "next/server";
import { lookupTerm } from "@/lib/dictionary";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");

  if (!term) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const entry = lookupTerm(term);

  if (!entry) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, entry });
}

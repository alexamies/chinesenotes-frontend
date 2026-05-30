import { NextRequest, NextResponse } from "next/server";
import { lookupTerm } from "@/lib/dictionary";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");

  if (!term) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const entries = lookupTerm(term);

  if (!entries) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, entries });
}

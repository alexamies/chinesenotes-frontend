import { NextRequest, NextResponse } from "next/server";
import { lookupTerm } from "@/lib/dictionary";
import { segmentText } from "@/lib/segmentation";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");

  if (!term) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const segments = segmentText(term, lookupTerm);

  return NextResponse.json({ found: true, segments });
}

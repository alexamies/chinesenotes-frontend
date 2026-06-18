import { NextRequest, NextResponse } from "next/server";
import { createSession, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();

  const existing = request.cookies.get("cn_sid");
  let needsNew = !existing;

  if (existing) {
    const id = await verifySession(existing.value);
    if (!id) needsNew = true;
  }

  if (needsNew) {
    const { value } = await createSession();
    response.cookies.set("cn_sid", value, {
      httpOnly: true,
      sameSite: "strict",
      secure: request.url.startsWith("https://"),
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  // Run on every route except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.ico).*)"],
};

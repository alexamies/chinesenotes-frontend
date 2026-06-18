import { NextRequest, NextResponse } from "next/server";
import { createSession, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const existing = request.cookies.get("cn_sid");

  let hasValidSession = false;
  if (existing) {
    const id = await verifySession(existing.value);
    hasValidSession = id !== null;
  }

  // Library pages require a session established from a prior page visit.
  // Cold requests (curl, no cookie) are redirected to the home page, where
  // the browser picks up the session cookie before accessing library content.
  if (!hasValidSession && pathname.startsWith("/library")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  if (!hasValidSession) {
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
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.ico).*)"],
};

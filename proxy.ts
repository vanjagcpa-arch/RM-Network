import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/auth";

const SESSION_COOKIE = "rm_session";

const protectedPrefixes = ["/dashboard", "/properties", "/jobs", "/calendar", "/links", "/settings", "/technicians", "/buildings", "/compliance", "/templates", "/agent", "/maintenance-requests", "/agents"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/properties/:path*", "/jobs/:path*", "/calendar/:path*", "/links/:path*", "/settings/:path*", "/technicians/:path*", "/buildings/:path*", "/compliance/:path*", "/templates/:path*", "/agent/:path*", "/agent", "/maintenance-requests/:path*", "/agents/:path*"],
};

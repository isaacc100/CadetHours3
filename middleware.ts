import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  const publicPaths = ["/auth/signin", "/auth/register", "/auth/error", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Protected routes
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(session.user as any)?.isAdmin) {
      return pathname.startsWith("/api")
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

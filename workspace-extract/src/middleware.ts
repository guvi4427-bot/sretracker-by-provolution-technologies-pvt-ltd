import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/signup", "/terms", "/privacy", "/about", "/contact", "/community-guidelines", "/api/auth", "/api/health", "/_next", "/favicon", "/public", "/logo.svg", "/logo.png", "/ads.txt", "/robots.txt"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes("_next/static") || pathname.includes("_next/image") || pathname.includes("favicon.ico") || pathname.includes("logo.svg") || pathname.includes("logo.png") || pathname.endsWith(".txt")) {
    return NextResponse.next();
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET || 'sre-platform-insecure-secret-please-set-nextauth-secret-env';
    const token = await getToken({ req: request, secret });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Admin route guard - only admins can access /admin and /api/admin
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (!token.isAdmin) {
        return NextResponse.redirect(new URL("/home", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Graceful handling - allow through rather than crash
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|logo.svg|logo.png).*)"],
};

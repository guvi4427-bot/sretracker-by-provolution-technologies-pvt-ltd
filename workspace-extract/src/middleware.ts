import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/signup", "/terms", "/privacy", "/about", "/contact", "/community-guidelines", "/api/auth", "/api/health", "/_next", "/favicon", "/favicon-96x96.png", "/favicon.ico", "/apple-touch-icon.png", "/web-app-manifest-192x192.png", "/web-app-manifest-512x512.png", "/site.webmanifest", "/public", "/logo.svg", "/logo.png", "/ads.txt", "/robots.txt", "/sitemap.xml"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes("_next/static") || pathname.includes("_next/image") || pathname.includes("favicon") || pathname.includes("logo.svg") || pathname.includes("logo.png") || pathname.endsWith(".txt") || pathname.endsWith(".xml") || pathname.endsWith(".webmanifest") || pathname.endsWith(".ico")) {
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
  matcher: ["/((?!_next/static|_next/image|favicon|public|logo.svg|logo.png|site.webmanifest|apple-touch-icon|web-app-manifest).*)"],
};

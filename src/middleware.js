import { NextResponse } from "next/server";
import { ADMIN_ROUTES } from "@/lib/navigation";

function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;
  const role = request.cookies.get("role")?.value;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role !== "admin" && isAdminRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

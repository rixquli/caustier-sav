import { NextResponse } from "next/server";
import { ADMIN_ROUTES } from "@/lib/navigation";

function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

const PUBLIC_PATHS = ["/login", "/api/auth"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const sessionRes = await fetch(
    new URL("/api/me", request.url).toString(),
    {
      headers: { cookie: request.headers.get("cookie") || "" },
    },
  );

  const data = sessionRes.ok ? await sessionRes.json() : null;
  const user = data?.user;

  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    user.mustChangePassword &&
    user.role === "client" &&
    pathname !== "/compte/changer-mot-de-passe"
  ) {
    return NextResponse.redirect(
      new URL("/compte/changer-mot-de-passe", request.url),
    );
  }

  if (user.role !== "admin" && isAdminRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

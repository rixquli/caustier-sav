import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicApiRoute } from "@/lib/api-public-paths";
import { ADMIN_ROUTES } from "@/lib/navigation";
import type { MeResponse } from "@/types/user";

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

const PUBLIC_PAGE_PATHS = ["/login"];

async function getSessionUser(request: NextRequest) {
  const sessionRes = await fetch(new URL("/api/me", request.url).toString(), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store",
  });

  if (!sessionRes.ok) {
    return null;
  }

  const data = (await sessionRes.json()) as MeResponse;
  return data?.user ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (PUBLIC_PAGE_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const user = await getSessionUser(request);

  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const mustChangePassword = user.mustChangePassword === true;

  if (
    mustChangePassword &&
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};

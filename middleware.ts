import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/templates",
  "/integrations",
  "/billing",
  "/settings",
];

const authRoutes = ["/login", "/signup"];

function matchesPath(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function withResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && matchesPath(pathname, protectedRoutes)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withResponseCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && matchesPath(pathname, authRoutes)) {
    return withResponseCookies(
      response,
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/templates/:path*",
    "/integrations/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};

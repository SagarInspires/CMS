import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/auth/session";

const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/register", "/"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  const session = await verifySession();

  if (isProtectedRoute && !session?.isAuth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.isAuth && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

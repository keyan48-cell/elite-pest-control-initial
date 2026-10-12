import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Section 7 principle: master pricing must stay protected from Sales.
    if (pathname.startsWith("/pricing") && role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard?denied=pricing", req.url));
    }
    // Section 6: services catalog is Admin-managed.
    if (pathname.startsWith("/services") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?denied=services", req.url));
    }
    // Section 16: audit log is Admin-only.
    if (pathname.startsWith("/audit") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?denied=audit", req.url));
    }
    // Section 2/16: user management is Admin-only.
    if (pathname.startsWith("/users") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?denied=users", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/properties/:path*",
    "/services/:path*",
    "/pricing/:path*",
    "/quotations/:path*",
    "/users/:path*",
    "/audit/:path*",
  ],
};

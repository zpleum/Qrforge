import { auth } from "@/auth";

// First line of defence only. Every page, route handler and server action ALSO re-checks the session
// (and admin / ownership) itself. Never rely on a single layer.
export default auth((req) => {
  if (!req.auth) return Response.redirect(new URL("/", req.nextUrl.origin));
});

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };

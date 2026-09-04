import { NextResponse, type NextRequest } from "next/server";

/**
 * Pages are prerendered and otherwise ship with only an `s-maxage` directive,
 * which browsers (Safari especially) treat as "cache heuristically". That left
 * phones showing builds from hours earlier. Hashed assets under /_next/static
 * stay immutable; HTML must revalidate on every visit (cheap: ETag 304s).
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return res;
}

export const config = {
  matcher: [
    // everything except Next internals and static brand/media assets
    "/((?!_next/static|_next/image|media/|brand/|vial/|mockup/|icon\\.png|apple-icon\\.png|favicon\\.ico).*)",
  ],
};

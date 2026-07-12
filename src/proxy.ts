import { NextRequest, NextResponse } from "next/server";

/**
 * Next 16 convention: proxy.ts (was middleware.ts). The dashboard used to live at "/" with shareable ?address= links.
 * Keep those links working now that "/" is the landing page.
 */
export function proxy(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (address) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};

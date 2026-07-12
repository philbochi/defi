import { NextRequest, NextResponse } from "next/server";
import { isAddress, getAddress } from "viem";
import { getPortfolio } from "@/lib/portfolio";
import { isRateLimited } from "@/lib/rate-limit";
import { UpstreamError } from "@/lib/alchemy";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!process.env.ALCHEMY_API_KEY || !process.env.COINGECKO_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with data-provider API keys." },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — try again in a minute." },
      { status: 429 },
    );
  }

  const raw = req.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (!isAddress(raw, { strict: false })) {
    return NextResponse.json(
      { error: "Invalid Ethereum address." },
      { status: 400 },
    );
  }
  // Accept any casing; normalize to the checksummed form.
  const address = getAddress(raw.toLowerCase());

  try {
    const portfolio = await getPortfolio(address);
    return NextResponse.json(portfolio, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
    });
  } catch (err) {
    console.error("portfolio lookup failed:", err);
    const provider = err instanceof UpstreamError ? err.provider : "upstream";
    return NextResponse.json(
      { error: `Could not fetch portfolio data (${provider} error). Try again shortly.` },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import { getQuote } from "@/lib/swap/quoter";
import { isSwapSymbol } from "@/lib/swap/constants";
import { isRateLimited } from "@/lib/rate-limit";
import { UpstreamError } from "@/lib/alchemy";

export const runtime = "nodejs";

/** Testnet sanity ceiling — nobody swaps a million test ETH. */
const MAX_AMOUNT_IN = parseUnits("1000000", 18);

export async function GET(req: NextRequest) {
  if (!process.env.ALCHEMY_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured with data-provider API keys." },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Quotes fire per keystroke (debounced), so they get their own, larger budget.
  if (isRateLimited(`quote:${ip}`, 60)) {
    return NextResponse.json(
      { error: "Too many requests — try again in a minute." },
      { status: 429 },
    );
  }

  const params = req.nextUrl.searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const rawAmount = params.get("amountIn") ?? "";

  if (!isSwapSymbol(from) || !isSwapSymbol(to) || from === to) {
    return NextResponse.json(
      { error: "Unsupported token pair." },
      { status: 400 },
    );
  }

  let amountIn: bigint;
  try {
    amountIn = parseUnits(rawAmount, 18);
  } catch {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }
  if (amountIn <= 0n || amountIn > MAX_AMOUNT_IN) {
    return NextResponse.json({ error: "Amount out of range." }, { status: 400 });
  }

  try {
    const quote = await getQuote(from, to, amountIn);
    return NextResponse.json(quote, {
      headers: { "Cache-Control": "public, max-age=3" },
    });
  } catch (err) {
    console.error("quote failed:", err);
    const provider = err instanceof UpstreamError ? err.provider : "upstream";
    return NextResponse.json(
      { error: `Could not fetch a quote (${provider} error). Try again shortly.` },
      { status: 502 },
    );
  }
}

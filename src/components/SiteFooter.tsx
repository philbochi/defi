export default function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-ink-3 sm:px-6">
        <span>
          Built by{" "}
          <a
            href="https://philbochi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-2 transition-colors hover:text-ink"
          >
            Phil Bochi
          </a>{" "}
          — Next.js · Alchemy · CoinGecko · Uniswap · Recharts
        </span>
        <span>Balances and prices are informational, not financial advice.</span>
      </div>
    </footer>
  );
}

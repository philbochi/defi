import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-edge">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm font-semibold tracking-tight text-ink">
              defi.philbochi.com
            </span>
            <span className="hidden text-xs text-ink-3 sm:inline">
              Ethereum mainnet · read-only
            </span>
          </div>
          <nav className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-edge bg-surface px-3 py-1 font-medium text-ink">
              Dashboard
            </span>
            <span
              className="hidden rounded-full px-3 py-1 text-ink-3 sm:inline"
              title="Project 2 — coming soon"
            >
              Swap · soon
            </span>
            <span
              className="hidden rounded-full px-3 py-1 text-ink-3 sm:inline"
              title="Project 3 — coming soon"
            >
              Stake · soon
            </span>
            <a
              href="https://github.com/philbochi/defi"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1 text-ink-2 transition-colors hover:text-ink"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Dashboard />
      </main>

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
            — Next.js · Alchemy · CoinGecko · Recharts
          </span>
          <span>Balances and prices are informational, not financial advice.</span>
        </div>
      </footer>
    </div>
  );
}

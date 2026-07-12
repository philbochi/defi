import Link from "next/link";

export default function SiteHeader({
  active,
}: {
  active: "home" | "dashboard" | "swap" | "stake" | "deep-dives";
}) {
  const tab = (isActive: boolean) =>
    isActive
      ? "rounded-full border border-edge bg-surface px-3 py-1 font-medium text-ink"
      : "rounded-full px-3 py-1 text-ink-2 transition-colors hover:text-ink";

  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight text-ink"
          >
            defi.philbochi.com
          </Link>
          <span className="hidden text-xs text-ink-3 sm:inline">
            {active === "home"
              ? "Web3 engineering portfolio"
              : active === "dashboard"
                ? "Ethereum mainnet · read-only"
                : active === "deep-dives"
                  ? "the engineering behind the projects"
                  : `Sepolia testnet · ${active}`}
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-xs sm:gap-2">
          <Link href="/" className={tab(active === "home")}>
            Home
          </Link>
          <Link href="/dashboard" className={tab(active === "dashboard")}>
            Dashboard
          </Link>
          <Link href="/swap" className={tab(active === "swap")}>
            Swap<span className="hidden md:inline"> · testnet</span>
          </Link>
          <Link href="/stake" className={tab(active === "stake")}>
            Stake<span className="hidden md:inline"> · testnet</span>
          </Link>
          <Link
            href="/case-studies"
            className={`${tab(active === "deep-dives")} hidden sm:inline`}
          >
            Deep-dives
          </Link>
          <a
            href="https://github.com/philbochi/defi"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1 text-ink-2 transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href="https://philbochi.com"
            className="rounded-full px-3 py-1 text-ink-2 transition-colors hover:text-ink"
          >
            Phil Bochi
          </a>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

export default function SiteHeader({
  active,
}: {
  active: "dashboard" | "swap" | "stake" | "deep-dives";
}) {
  const tab = (isActive: boolean) =>
    isActive
      ? "rounded-full border border-edge bg-surface px-3 py-1 font-medium text-ink"
      : "rounded-full px-3 py-1 text-ink-2 transition-colors hover:text-ink";

  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-tight text-ink"
          >
            defi.philbochi.com
          </Link>
          <span className="hidden text-xs text-ink-3 sm:inline">
            {active === "dashboard"
              ? "Ethereum mainnet · read-only"
              : active === "deep-dives"
                ? "the engineering behind the projects"
                : `Sepolia testnet · ${active}`}
          </span>
        </div>
        <nav className="flex items-center gap-2 text-xs">
          <Link href="/" className={tab(active === "dashboard")}>
            Dashboard
          </Link>
          <Link href="/swap" className={tab(active === "swap")}>
            Swap · testnet
          </Link>
          <Link href="/stake" className={tab(active === "stake")}>
            Stake · testnet
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
        </nav>
      </div>
    </header>
  );
}

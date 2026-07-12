"use client";

import { useState } from "react";

/**
 * Token logo with a deterministic colored-initials fallback — many long-tail
 * tokens have no logo URL, and some logo URLs 404.
 */
export default function TokenIcon({
  symbol,
  logo,
  size = 28,
}: {
  symbol: string;
  logo: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote logo hosts are unbounded; next/image needs a fixed allowlist
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full bg-surface-2"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[10px] font-semibold text-ink-2"
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 3).toUpperCase()}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import type { Portfolio } from "@/lib/types";
import AddressForm from "./AddressForm";
import { Medallion } from "./landing/glyphs";
import SummaryCard from "./SummaryCard";
import AllocationChart from "./AllocationChart";
import HoldingsTable from "./HoldingsTable";

type Status = "idle" | "loading" | "loaded" | "error";

export default function Dashboard() {
  const [status, setStatus] = useState<Status>("idle");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presetAddress, setPresetAddress] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Shareable links: /?address=0x… runs the lookup on load. Deferred a
  // tick so no state is set synchronously inside the mount effect.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("address");
    if (!param || !isAddress(param, { strict: false })) return;
    const id = window.setTimeout(() => {
      setPresetAddress(param);
      void lookup(param);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  async function lookup(address: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(
        `/api/portfolio?address=${encodeURIComponent(address)}`,
        { signal: controller.signal },
      );
      if (!res.ok) {
        // Error bodies can be non-JSON (platform 504s, CDN error pages).
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Lookup failed (HTTP ${res.status}).`);
      }
      const body = (await res.json()) as Portfolio;
      setPortfolio(body);
      setStatus("loaded");
      window.history.replaceState(
        null,
        "",
        `?address=${encodeURIComponent(address)}`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Lookup failed.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Medallion glyph="p1" color="cyan" />
          <h1 className="text-2xl font-semibold tracking-tight">
            On-Chain Portfolio Dashboard
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-ink-2">
          Paste any Ethereum address to see its token balances, USD values,
          and allocation — live from mainnet. Read-only: no wallet connection,
          no signatures, nothing to approve.
        </p>
      </section>

      <AddressForm
        onSubmit={lookup}
        loading={status === "loading"}
        presetValue={presetAddress}
      />

      {status === "error" && error && (
        <div
          role="alert"
          className="rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-ink"
        >
          {error}
        </div>
      )}

      {status === "loading" && <LoadingSkeleton />}

      {status === "loaded" && portfolio && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <SummaryCard portfolio={portfolio} />
            <AllocationChart holdings={portfolio.priced} />
          </div>
          <HoldingsTable portfolio={portfolio} />
        </div>
      )}

      {status === "idle" && (
        <div className="rounded-xl border border-dashed border-edge px-6 py-12 text-center text-sm text-ink-3">
          Enter an address above — or try one of the examples — to load a
          portfolio.
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-label="Loading">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="h-44 rounded-xl border border-edge bg-surface" />
        <div className="h-44 rounded-xl border border-edge bg-surface" />
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-edge bg-surface p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { isAddress } from "viem";

const EXAMPLES = [
  {
    label: "vitalik.eth",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  },
  {
    label: "Ethereum Foundation",
    address: "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAE",
  },
] as const;

type Props = {
  onSubmit: (address: string) => void;
  loading: boolean;
  /** Fills the input when a lookup is triggered from the URL. */
  presetValue?: string | null;
};

export default function AddressForm({ onSubmit, loading, presetValue }: Props) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [lastPreset, setLastPreset] = useState<string | null | undefined>(
    undefined,
  );

  // Adjust state during render when the preset prop changes (React's
  // documented alternative to a setState-in-effect).
  if (presetValue !== lastPreset) {
    setLastPreset(presetValue);
    if (presetValue) setValue(presetValue);
  }

  function submit(address: string) {
    const trimmed = address.trim();
    if (!isAddress(trimmed, { strict: false })) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSubmit(trimmed);
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <label htmlFor="address" className="sr-only">
          Ethereum address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x… Ethereum address"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (invalid) setInvalid(false);
          }}
          aria-invalid={invalid}
          className={`min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
            invalid ? "border-negative" : "border-edge"
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : "Look up"}
        </button>
      </form>

      {invalid && (
        <p className="text-sm text-negative" role="alert">
          That doesn&apos;t look like a valid Ethereum address (expected
          0x&thinsp;+&thinsp;40 hex characters).
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink-3">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example.address}
            type="button"
            disabled={loading}
            onClick={() => {
              setValue(example.address);
              submit(example.address);
            }}
            className="rounded-full border border-edge bg-surface px-3 py-1.5 font-mono text-ink-2 transition-colors hover:border-accent/50 hover:text-ink disabled:opacity-50"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}

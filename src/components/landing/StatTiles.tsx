const ACCENT = {
  cyan: "text-neon-cyan border-neon-cyan/25",
  violet: "text-neon-violet border-neon-violet/25",
  emerald: "text-neon-emerald border-neon-emerald/25",
} as const;

/** Row of fact tiles — every number on these is real and verifiable. */
export default function StatTiles({
  color,
  stats,
}: {
  color: keyof typeof ACCENT;
  stats: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex flex-col gap-1 rounded-xl border bg-surface px-4 py-3 ${ACCENT[color].split(" ")[1]}`}
        >
          <span
            className={`tnum font-mono text-xl font-semibold ${ACCENT[color].split(" ")[0]}`}
          >
            {s.value}
          </span>
          <span className="text-xs leading-snug text-ink-3">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

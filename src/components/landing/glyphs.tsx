/** Shared ecosystem glyphs — the pipeline nodes and page medallions. */

export const GLYPHS: Record<string, React.ReactNode> = {
  p1: (
    // bar chart
    <g strokeLinecap="round">
      <path d="M9 17V11" />
      <path d="M14 17V7" />
      <path d="M19 17v-3" />
    </g>
  ),
  p2: (
    // swap arrows
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8h9l-2.5-2.5" />
      <path d="M20 16h-9l2.5 2.5" />
    </g>
  ),
  p3: (
    // vault / coin
    <g strokeLinecap="round">
      <circle cx="14" cy="12" r="5.5" />
      <path d="M14 9.5v5M12 11h4" />
    </g>
  ),
};

const MEDALLION_STYLE = {
  cyan: "border-neon-cyan/60 text-neon-cyan shadow-[0_0_22px_rgba(6,182,212,0.3)]",
  violet:
    "border-neon-violet/60 text-neon-violet shadow-[0_0_22px_rgba(139,92,246,0.3)]",
  emerald:
    "border-neon-emerald/60 text-neon-emerald shadow-[0_0_22px_rgba(16,185,129,0.3)]",
} as const;

/** Small glowing node medallion used as each app page's visual anchor. */
export function Medallion({
  glyph,
  color,
}: {
  glyph: keyof typeof GLYPHS;
  color: keyof typeof MEDALLION_STYLE;
}) {
  return (
    <span
      aria-hidden
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-surface ${MEDALLION_STYLE[color]}`}
    >
      <svg
        viewBox="0 0 28 24"
        className="h-6 w-6"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      >
        {GLYPHS[glyph]}
      </svg>
    </span>
  );
}

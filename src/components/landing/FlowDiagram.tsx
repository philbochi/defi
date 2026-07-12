const ACCENT = {
  cyan: { pill: "border-neon-cyan/40 text-neon-cyan", arrow: "text-neon-cyan/60" },
  violet: { pill: "border-neon-violet/40 text-neon-violet", arrow: "text-neon-violet/60" },
  ember: {
    pill: "border-neon-ember/40 text-neon-ember",
    arrow: "text-neon-ember/60",
  },
} as const;

/**
 * Horizontal pill-flow diagram (wraps on small screens). Steps marked
 * `dim` render as supporting infrastructure rather than actors.
 */
export default function FlowDiagram({
  color,
  steps,
  caption,
}: {
  color: keyof typeof ACCENT;
  steps: { label: string; note?: string; dim?: boolean }[];
  caption?: string;
}) {
  const a = ACCENT[color];
  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-edge bg-surface-2/50 p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((step, i) => (
          <span key={step.label} className="flex items-center gap-2">
            <span
              className={`flex flex-col rounded-lg border bg-surface px-3 py-1.5 ${
                step.dim ? "border-edge text-ink-2" : a.pill
              }`}
            >
              <span className="font-mono text-[11px] font-medium">
                {step.label}
              </span>
              {step.note && (
                <span className="font-mono text-[10px] text-ink-2">
                  {step.note}
                </span>
              )}
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className={`font-mono text-sm ${a.arrow}`}>
                →
              </span>
            )}
          </span>
        ))}
      </div>
      {caption && (
        <figcaption className="font-mono text-[11px] text-ink-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

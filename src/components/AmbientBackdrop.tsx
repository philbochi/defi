const BLOB = {
  cyan: "rgba(6,182,212,0.10)",
  violet: "rgba(139,92,246,0.10)",
  emerald: "rgba(16,185,129,0.10)",
  slate: "rgba(148,163,184,0.07)",
} as const;

/**
 * Blueprint-grid + accent glow backdrop shared by all pages — the
 * landing page's visual language, dialed down for app screens.
 */
export default function AmbientBackdrop({
  color = "slate",
}: {
  color?: keyof typeof BLOB;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[520px] opacity-[0.32]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 75% 90% at 50% 0%, black, transparent)",
        }}
      />
      <div
        className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: BLOB[color] }}
      />
    </div>
  );
}

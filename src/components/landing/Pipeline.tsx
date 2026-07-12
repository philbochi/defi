import { PROJECTS, SNIPPETS } from "@/lib/landing/content";
import { GLYPHS } from "./glyphs";

const NODE_STYLE = {
  cyan: {
    ring: "border-neon-cyan/60",
    glow: "shadow-[0_0_28px_rgba(6,182,212,0.35)]",
    text: "text-neon-cyan",
    dot: "bg-neon-cyan",
  },
  violet: {
    ring: "border-neon-violet/60",
    glow: "shadow-[0_0_28px_rgba(139,92,246,0.35)]",
    text: "text-neon-violet",
    dot: "bg-neon-violet",
  },
  emerald: {
    ring: "border-neon-emerald/60",
    glow: "shadow-[0_0_28px_rgba(16,185,129,0.35)]",
    text: "text-neon-emerald",
    dot: "bg-neon-emerald",
  },
} as const;

const TOOLTIP_CODE: Record<string, string> = {
  p1: SNIPPETS.p1Chosen.split("\n")[1].trim(),
  p2: "multicall(exactInputSingle, unwrapWETH9) — one signature",
  p3: "token.mint(msg.sender, amount); // never from principal",
};


/**
 * The living pipeline: three ecosystem nodes joined by a glowing data
 * path with SMIL-animated pulses (no JS, hardware-cheap, and it simply
 * holds still under prefers-reduced-motion via CSS).
 */
export default function Pipeline() {
  return (
    <div className="relative">
      {/* connector layer (desktop) — same height as the node row so the
          path threads through the node centers */}
      <svg
        aria-hidden
        viewBox="0 0 900 80"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-20 w-full sm:block motion-reduce:[&_circle]:hidden"
        fill="none"
      >
        <defs>
          <linearGradient id="pipe" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="pipeGlow" x="-20%" y="-300%" width="140%" height="700%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.45" />
          </filter>
        </defs>

        <path
          id="pipePath"
          d="M150 40 C 270 14, 330 66, 450 40 S 630 14, 750 40"
          stroke="url(#pipe)"
          strokeWidth="1.5"
          strokeDasharray="6 5"
          filter="url(#pipeGlow)"
          opacity="0.85"
        />

        {/* one pulse per ecosystem — a gradient fill can't follow
            animateMotion's transform, so each particle owns a color */}
        {["#06b6d4", "#8b5cf6", "#10b981"].map((fill, i) => (
          <circle key={fill} r="3.5" fill={fill} opacity="0">
            <animateMotion
              dur="4.5s"
              begin={`${i * 1.5}s`}
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
            >
              <mpath href="#pipePath" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.08;0.92;1"
              dur="4.5s"
              begin={`${i * 1.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>

      {/* nodes */}
      <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-4">
        {PROJECTS.map((p) => {
          const s = NODE_STYLE[p.color];
          return (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="group relative flex flex-col items-center gap-3 outline-none"
              aria-label={`${p.title} — jump to details`}
            >
              {/* tooltip */}
              <div
                role="tooltip"
                className="pointer-events-none absolute -top-2 z-20 w-64 -translate-y-full scale-95 rounded-xl border border-edge bg-surface-2 p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
              >
                <p className="text-xs leading-relaxed text-ink-2">{p.decision}</p>
                <p className={`mt-2 truncate font-mono text-[10px] ${s.text}`}>
                  {TOOLTIP_CODE[p.id]}
                </p>
              </div>

              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl border bg-surface ${s.ring} ${s.glow} transition-transform duration-200 group-hover:-translate-y-1`}
              >
                <svg
                  viewBox="0 0 28 24"
                  className={`h-9 w-9 ${s.text}`}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  aria-hidden
                >
                  {GLYPHS[p.id]}
                </svg>
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {p.chain}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {p.index} · {p.title}
                </span>
                <span className="max-w-55 text-xs leading-snug text-ink-3">
                  {p.tagline}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

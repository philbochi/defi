# design-system.md — defi.philbochi.com

Produced via /webdesign M1 (2026-07-12, revision 2 after client feedback:
"deep purples, not pink; more content per app page; anchor nav on
deep-dives"). Builders build against this; /qa --site audits against it.

## Vibe & the three questions

- **Feel:** engineering credibility — a living blueprint, not a hype site.
- **See first/second/third:** (1) the working instrument or pipeline,
  (2) the ecosystem color telling you *which* chain you're on,
  (3) the reasoning — decisions, stats, code.
- **One action per page:** landing → explore a project; app pages → use
  the widget; deep-dives → read, then open an app.

## Color (60/30/10, dark)

- 60% — `#0b0d12` page / `#12151c` surface (unchanged).
- 30% — `#191d26` surface-2, alpha borders `rgba(255,255,255,0.08)`.
- 10% — **one accent per page**, keyed to the ecosystem:

| Role | Decorative (chips/glows/lines) | Interactive (buttons/links) | Why |
|---|---|---|---|
| Mainnet / dashboard | cyan `#06b6d4` | `#0e7490` | liquid mainnet identity; 700-shade holds 4.5:1 with white labels |
| Testnet / swap | **deep violet `#8b5cf6`** | `#6d28d9` | client direction: deep purples anchor the testnet identity; violet reads "premium/creative" and sits harmonically between cyan and emerald |
| Vault / stake | emerald `#10b981` | `#047857` | value/yield association; completes an analogous cool sweep cyan→violet→emerald |

- Hero gradient and pipeline: cyan → violet → emerald (the three
  ecosystems in build order). CVD-validated as a set (see below).
- Accent appears ≤3 times per viewport; everything else stays neutral.

## Type

Geist Sans (UI/prose) + Geist Mono (numbers, chips, code, telemetry).
Tabular numerals on any column of figures. No third face.

## Section plan — app pages (dashboard / swap / stake)

The widget is the page's **signature instrument and stays first**; the
enrichment sits below it, calm, never competing:

1. Ecosystem chip (mono, page accent) — orientation.
2. **The widget** (unchanged position and behavior).
3. "How it works" — FlowDiagram pill-run of the request/tx path.
4. Proof band — 3 StatTiles of real, verifiable numbers.
5. Info cards — page-specific practical content (what to try / route
   matrix / 3-step quickstart, contract addresses with Etherscan links).
6. Closing cross-link — one line to the matching deep-dive section.

Reason: archetype order "instrument → how it works → proof → detail →
next step"; the widget never scrolls out of first-viewport primacy.

## Deep-dives

Anchor TOC (chip row: 01 · 02 · 03) directly under the page intro;
sections carry scroll-mt for fixed-header offset. Prose interleaved with
StatTiles / FlowDiagram / shiki code every 1–2 paragraphs.

## Motion

Reveals ≤0.55s, once, ease-out; SMIL pulses on the pipeline only; every
auto-updating element is pausable and respects prefers-reduced-motion.
DOM shape never changes with motion preference (learned the hard way).

## Honesty rule (this project's signature constraint)

Every number, event name, and code snippet on any page must be real —
from this repo, its deployed contracts, or a measured demo — or be
explicitly labeled simulated/abridged. No invented metrics, ever.

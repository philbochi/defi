/**
 * Build-time syntax highlighting via shiki — pure static HTML, zero
 * client-side JS. Highlighter is a module-level singleton so repeated
 * renders share one instance.
 */

import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ["tokyo-night"],
    langs: ["typescript", "solidity"],
  });
  return highlighterPromise;
}

export async function highlight(
  code: string,
  lang: "typescript" | "solidity",
): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    theme: "tokyo-night",
    colorReplacements: {
      // Match the site surface instead of the theme's own background.
      "#1a1b26": "#12151c",
      // Lift comment tokens to AA contrast on the dark surface — the
      // comments carry the copy in these snippets.
      "#51597d": "#8a93b8",
      "#5a638c": "#8a93b8",
      "#646e9c": "#98a0c4",
    },
  });
}

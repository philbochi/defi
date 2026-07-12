"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Scroll-into-view fade/rise.
 *
 * The DOM shape never changes with the user's motion preference — the
 * SSR HTML carries opacity:0, so the motion element must always mount
 * and drive the style to visible. Under reduced motion the transition
 * collapses to zero duration (content appears instantly, nothing slides).
 * A <noscript> rule in the root layout un-hides [data-reveal] when JS is
 * disabled entirely.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.55, delay, ease: [0.21, 0.65, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}

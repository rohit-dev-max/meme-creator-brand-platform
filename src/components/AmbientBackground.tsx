"use client";

/**
 * AmbientBackground — live aurora / mesh-gradient background.
 *
 * Drop it once near the top of your layout:
 *
 *   import AmbientBackground from "@/components/AmbientBackground";
 *
 *   <body>
 *     <AmbientBackground />
 *     <div className="relative z-10">…your content…</div>
 *   </body>
 *
 * - Pure CSS animations (transform/opacity only) + one tiny rAF loop for the
 *   cursor glow. No libraries.
 * - Fixed, full-screen, z-index 0, pointer-events: none — never blocks clicks.
 * - Tune colors/speed/blur in `ambient-background.css` (:root variables).
 * - Honors prefers-reduced-motion (static gradient) and hides the cursor
 *   glow on touch devices.
 * - Dark by default; pass theme="light" or set <html data-theme="light">.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import "./ambient-background.css";

interface AmbientBackgroundProps {
  /** "dark" (default) or "light" palette. */
  theme?: "dark" | "light";
  /** Global speed multiplier — 0.5 calm, 1 default, 2 energetic. */
  speed?: number;
  /** Orb intensity (opacity 0–1). */
  intensity?: number;
  /** Orb-layer blur, e.g. "90px". Lower = cheaper on weak GPUs. */
  blur?: string;
  /** Show the film-grain overlay (default true). */
  grain?: boolean;
  /** Show the mouse-follow glow on desktop (default true). */
  cursor?: boolean;
}

export default function AmbientBackground({
  theme = "dark",
  speed,
  intensity,
  blur,
  grain = true,
  cursor = true,
}: AmbientBackgroundProps) {
  const cursorRef = useRef<HTMLDivElement>(null);

  // Buttery cursor glow: lerped rAF loop writing transform directly (no re-render).
  useEffect(() => {
    if (!cursor) return;
    if (typeof window === "undefined") return;
    // Respect reduced motion + touch devices (CSS also hides it there).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let shown = false;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!shown) {
        shown = true;
        el.style.opacity = "var(--ambient-cursor-opacity)";
      }
    };

    const loop = () => {
      // Lerp toward the pointer — 0.07 feels like drifting light.
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [cursor]);

  // Props → CSS variable overrides (CSS file stays the source of truth).
  const overrides = {
    ...(speed !== undefined ? { "--ambient-speed": String(speed) } : {}),
    ...(intensity !== undefined ? { "--ambient-orb-opacity": String(intensity) } : {}),
    ...(blur ? { "--ambient-blur": blur } : {}),
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={`ambient-root${theme === "light" ? " ambient--light" : ""}`}
      style={overrides}
    >
      {/* Blurred drifting orbs (mesh gradient) */}
      <div className="ambient-layer ambient-orbs">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="ambient-orb ambient-orb-4" />
        <div className="ambient-orb ambient-orb-5" />
      </div>

      {/* Diagonal aurora wash */}
      <div className="ambient-layer ambient-aurora" />

      {/* Mouse-follow glow (desktop only, JS-positioned) */}
      {cursor && <div ref={cursorRef} className="ambient-cursor" />}

      {/* Readability scrim — keeps text contrast over the lights */}
      <div className="ambient-layer ambient-scrim" />

      {/* Film grain for depth */}
      {grain && <div className="ambient-layer ambient-grain" />}
    </div>
  );
}

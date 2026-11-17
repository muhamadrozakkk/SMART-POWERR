"use client";

import { useEffect } from "react";

export function AnimatedAuroraBackground() {
  useEffect(() => {
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--pointer-x", `${(event.clientX / innerWidth - 0.5) * 22}px`);
        document.documentElement.style.setProperty("--pointer-y", `${(event.clientY / innerHeight - 0.5) * 22}px`);
        const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".metric-card, .panel-card, .stat-tile, .energy-insight, .sidebar-nav a");
        if (card) {
          const bounds = card.getBoundingClientRect();
          card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
          card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
        }
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <div className="aurora-background" aria-hidden="true"><div className="aurora-orb aurora-orb--blue" /><div className="aurora-orb aurora-orb--indigo" /><div className="aurora-orb aurora-orb--gold" /><div className="aurora-ribbons" /><div className="aurora-sparkles"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="aurora-noise" /></div>;
}

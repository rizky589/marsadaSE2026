"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function GsapGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const tween = gsap.to(ref.current, { opacity: 0.65, scale: 1.06, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return () => {
      tween.kill();
    };
  }, []);

  return <div ref={ref} className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-400/25 blur-3xl" />;
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  textClassName?: string;
  subtitle?: string;
  light?: boolean;
  compact?: boolean;
  showLogo?: boolean;
};

export function BrandLockup({ className, textClassName, subtitle = "Monitoring, Analisis, Rekap, Supervisi, dan Data Lapangan", light = false, compact = false, showLogo = true }: BrandLockupProps) {
  const [showBpsLogo, setShowBpsLogo] = useState(true);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {showLogo ? (
        <div className="flex shrink-0 items-center gap-2">
          {showBpsLogo ? (
          <img
            src="/brand/bps.png"
            alt="Logo BPS"
            className={cn("rounded-2xl object-contain", compact ? "h-11 w-11 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-20 sm:w-20")}
            loading="eager"
            onError={() => setShowBpsLogo(false)}
          />
          ) : null}
        </div>
      ) : null}
      <div className={cn("min-w-0", textClassName)}>
        <p className={cn("font-black leading-tight", compact ? "text-xl" : "text-xl", light ? "text-white" : "text-slate-950 dark:text-white")}>MARSADA</p>
        <p className={cn("font-semibold leading-snug", compact ? "text-[11px]" : "text-xs", light ? "text-white/75" : "text-slate-500 dark:text-slate-400")}>{subtitle}</p>
      </div>
    </div>
  );
}

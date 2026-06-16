import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("h-11 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-slate-900/70 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:ring-orange-500/20", className)}
    {...props}
  />
));
Input.displayName = "Input";

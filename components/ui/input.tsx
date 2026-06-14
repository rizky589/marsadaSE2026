import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("h-11 w-full rounded-2xl border border-[var(--border)] bg-white/75 px-4 text-sm outline-none transition focus:border-[#ff7a1a] focus:ring-2 focus:ring-orange-200 dark:bg-white/10 dark:focus:ring-orange-500/20", className)}
    {...props}
  />
));
Input.displayName = "Input";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0b2a4a] text-white shadow-lg shadow-blue-950/15 hover:bg-[#ff7a1a] hover:shadow-orange-500/20 dark:bg-blue-200 dark:text-slate-950 dark:hover:bg-[#ff7a1a]",
        secondary: "border border-[var(--border)] bg-white/70 text-slate-900 hover:border-[#ff7a1a] hover:text-[#ff7a1a] dark:bg-white/10 dark:text-white",
        ghost: "text-slate-700 hover:bg-orange-50 hover:text-[#ff7a1a] dark:text-slate-200 dark:hover:bg-white/10",
        destructive: "bg-red-600 text-white hover:bg-red-700"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 rounded-xl px-3",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

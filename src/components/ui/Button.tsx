"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-40",
          "active:scale-[0.97]",
          {
            "rounded-full bg-mint text-white shadow-sm hover:bg-mint-dark":
              variant === "primary",
            "rounded-full bg-surface border border-border text-foreground hover:bg-muted/10":
              variant === "secondary",
            "rounded-full text-muted hover:text-foreground hover:bg-muted/10":
              variant === "ghost" || variant === "icon",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-5 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10 p-0": variant === "icon",
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

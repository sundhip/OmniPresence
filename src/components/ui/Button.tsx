"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none whitespace-nowrap flex-nowrap shrink-0";

    const variantStyles = {
      primary:
        "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm hover:shadow-[var(--shadow-glow)]",
      secondary:
        "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] shadow-[var(--shadow-subtle)]",
      outline:
        "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-soft)] hover:border-[var(--primary)]",
      ghost:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]",
      soft:
        "bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-90",
      danger:
        "bg-[var(--error)] text-white hover:opacity-90 shadow-sm",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs rounded-full gap-1.5 min-h-[36px]",
      md: "h-11 px-5 text-sm rounded-full gap-2 min-h-[44px]",
      lg: "h-12 px-7 text-base rounded-full gap-2.5 min-h-[48px]",
      icon: "h-10 w-10 p-0 rounded-full",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="flex-shrink-0 inline-flex items-center">{leftIcon}</span>
        )}
        {children && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap flex-nowrap">
            {children}
          </span>
        )}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0 inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

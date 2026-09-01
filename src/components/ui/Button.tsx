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
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none";

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
      sm: "h-8 px-3 text-xs rounded-full gap-1.5",
      md: "h-10 px-4 text-sm rounded-full gap-2",
      lg: "h-12 px-6 text-base rounded-full gap-2.5",
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
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

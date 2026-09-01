"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "outline" | "success" | "warning" | "error" | "lavender" | "cyan";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)] border border-transparent",
    secondary: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border border-[var(--border)]",
    outline: "bg-transparent text-[var(--text-primary)] border border-[var(--border)]",
    success: "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20",
    error: "bg-[var(--error-soft)] text-[var(--error)] border border-[var(--error)]/20",
    lavender: "bg-[#F4EFFF] dark:bg-[#2A2044] text-[#6657D9] dark:text-[#B994FF] border border-[#6657D9]/20",
    cyan: "bg-[#E6F8FA] dark:bg-[#15343B] text-[#0891B2] dark:text-[#72DDE3] border border-[#0891B2]/20",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-medium rounded-full",
    md: "text-xs px-2.5 py-1 font-semibold rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

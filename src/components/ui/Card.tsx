"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "soft" | "outline" | "interactive";
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-card)]",
    elevated:
      "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-elevated)]",
    soft:
      "bg-[var(--surface-soft)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
    outline:
      "bg-transparent text-[var(--text-primary)] border border-[var(--border)]",
    interactive:
      "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-[var(--primary)]/50 transition-all duration-300 cursor-pointer active:scale-[0.99]",
  };

  return (
    <div
      className={cn("rounded-3xl p-6 relative overflow-hidden", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

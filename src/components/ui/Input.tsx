"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input_${label.toLowerCase().replace(/\s+/g, "_")}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-11 px-4 text-sm rounded-xl transition-all duration-200",
              "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]",
              "placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)]",
              "disabled:opacity-50 disabled:bg-[var(--surface-soft)]",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[var(--error)] focus:border-[var(--error)] focus:ring-red-500/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[var(--error)] animate-fade-in font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

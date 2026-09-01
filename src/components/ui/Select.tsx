"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? `select_${label.toLowerCase().replace(/\s+/g, "_")}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full h-11 px-4 pr-10 text-sm rounded-xl appearance-none transition-all duration-200 cursor-pointer",
              "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]",
              "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)]",
              "disabled:opacity-50 disabled:bg-[var(--surface-soft)]",
              error && "border-[var(--error)] focus:border-[var(--error)]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--surface)] text-[var(--text-primary)]">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = "Select";

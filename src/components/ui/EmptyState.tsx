"use client";

import React from "react";
import { Button } from "./Button";
import { Sparkles } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-16 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/50 animate-fade-in my-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm border border-[var(--border)]">
        {icon || <Sparkles className="w-7 h-7" />}
      </div>
      <h4 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 mt-6">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pill" | "underline";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "pill",
}: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1",
        variant === "pill" && "p-1 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none",
              variant === "pill" && [
                "rounded-xl",
                isActive
                  ? "bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm font-semibold border border-[var(--border-subtle)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]",
              ],
              variant === "underline" && [
                "border-b-2 py-2.5 px-3 rounded-none",
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]",
              ]
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

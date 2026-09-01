"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Sparkles, Sun, Moon, Search, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header({ onOpenAddItem }: { onOpenAddItem?: () => void }) {
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/wardrobe?search=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch("");
    }
  };

  return (
    <header
      className="sticky top-0 z-20 w-full border-b px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(var(--surface-elevated), 0.85)",
        borderColor: "var(--border)",
      }}
    >
      {/* Search & Breadcrumb Area */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search wardrobe, items, styles..."
            className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm rounded-full bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Add Clothing button */}
        {onOpenAddItem ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenAddItem}
            leftIcon={<Plus className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            Add Clothing
          </Button>
        ) : (
          <Link href="/wardrobe?action=new" className="hidden sm:inline-flex">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Clothing
            </Button>
          </Link>
        )}

        {/* Ask OP AI CTA */}
        <Link href="/outfits/new">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />}
          >
            <span className="hidden xs:inline">Ask</span> OP AI
          </Button>
        </Link>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors border border-[var(--border)]"
          title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-[#FBBF24]" />
          ) : (
            <Moon className="w-4 h-4 text-[#6657D9]" />
          )}
        </button>

        {/* User Profile */}
        {user && (
          <Link href="/profile" className="flex items-center gap-2 group">
            <Avatar src={user.avatar} name={user.name} size="sm" />
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import {
  Home,
  Shirt,
  Sparkles,
  User,
  Settings,
  Calendar,
  HeartPulse,
  Wallet,
  Sun,
  Moon,
  LogOut,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const navItems = [
    { label: "Home", href: "/home", icon: <Home className="w-5 h-5" />, active: pathname === "/home" },
    { label: "Wardrobe", href: "/wardrobe", icon: <Shirt className="w-5 h-5" />, active: pathname.startsWith("/wardrobe") },
    { label: "Outfits", href: "/outfits", icon: <Layers className="w-5 h-5" />, active: pathname.startsWith("/outfits") },
    { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" />, active: pathname === "/profile" },
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, active: pathname === "/settings" },
  ];

  const futureItems = [
    { label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
    { label: "Self-Care", icon: <HeartPulse className="w-4 h-4" /> },
    { label: "Finance", icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r p-5 flex-shrink-0 z-30 transition-colors duration-200"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Top section: Logo & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link href="/home" className="flex items-center gap-3 px-2 py-1 group">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6657D9] via-[#8B74EC] to-[#C8B5FF] text-white shadow-md shadow-[#6657D9]/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                OmniPresence
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                OP AI
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Personal Intelligence
            </p>
          </div>
        </Link>

        {/* Core Navigation */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">
            Intelligence Core
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group relative",
                item.active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  item.active ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.active && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Phase 2+ Extension Points */}
        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">
            Coming Next (Phase 2+)
          </p>
          <div className="space-y-1">
            {futureItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs text-[var(--text-muted)] opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--surface-soft)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section: User Info & Controls */}
      <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
        {/* OP AI Status Pill */}
        <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">OP AI Active</p>
              <p className="text-[10px] text-[var(--text-muted)]">Context engine ready</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
            title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-[#FBBF24]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6657D9]" />
            )}
          </button>
        </div>

        {/* User Profile Summary */}
        {user && (
          <div className="flex items-center justify-between px-1">
            <Link href="/profile" className="flex items-center gap-3 group flex-1 min-w-0">
              <Avatar src={user.avatar} name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] truncate text-[var(--text-muted)]">
                  {user.email}
                </p>
              </div>
            </Link>
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-soft)] transition-colors ml-2"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

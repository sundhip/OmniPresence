"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Layers, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { label: "Home", href: "/home", icon: <Home className="w-5 h-5" />, active: pathname === "/home" },
    { label: "Wardrobe", href: "/wardrobe", icon: <Shirt className="w-5 h-5" />, active: pathname.startsWith("/wardrobe") },
    { label: "AI Rec", href: "/outfits/new", icon: <Sparkles className="w-5 h-5 text-[var(--primary)]" />, active: pathname === "/outfits/new", isAi: true },
    { label: "Outfits", href: "/outfits", icon: <Layers className="w-5 h-5" />, active: pathname.startsWith("/outfits") && pathname !== "/outfits/new" },
    { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" />, active: pathname === "/profile" },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t px-2 py-1.5 flex items-center justify-around backdrop-blur-lg"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
      aria-label="Mobile Navigation"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-[10px] font-medium transition-all duration-200",
            item.active
              ? "text-[var(--primary)] font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          {item.isAi ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary-soft)] border border-[var(--primary)]/30 -mt-2 shadow-md">
              <Sparkles className="w-4 h-4 text-[var(--primary)] animate-pulse" />
            </div>
          ) : (
            <span className="w-5 h-5 mb-0.5">{item.icon}</span>
          )}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

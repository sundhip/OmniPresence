"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/context/AuthContext";
import { WardrobeFormModal } from "@/components/wardrobe/WardrobeFormModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Protected Route Check (Part 6, 7)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Loading OmniPresence...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-row bg-[var(--background)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-8">
        <Header onOpenAddItem={() => setIsAddItemOpen(true)} />
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileNav />

      {/* Global Add Clothing Modal */}
      <WardrobeFormModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
      />
    </div>
  );
}

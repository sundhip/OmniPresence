"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Shirt,
  Layers,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, demoSignIn } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleDemoAccess = async () => {
    await demoSignIn();
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--background)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#6657D9]/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-[#C8B5FF]/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6657D9] via-[#8B74EC] to-[#C8B5FF] text-white shadow-md shadow-[#6657D9]/20">
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
              Personal Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors border border-[var(--border)] cursor-pointer"
            title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-[#FBBF24]" />
            ) : (
              <Moon className="w-4 h-4 text-[#6657D9]" />
            )}
          </button>

          {user ? (
            <Link href="/home">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Open Platform
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={handleDemoAccess}>
                Instant Demo
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-16 text-center space-y-8 my-auto">
        <div className="space-y-5">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)] max-w-4xl mx-auto leading-[1.08]">
            Your Everyday Life,{" "}
            <span className="bg-gradient-to-r from-[#6657D9] via-[#A58BFF] to-[#E8B9E1] bg-clip-text text-transparent">
              Intelligently Unified.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            OmniPresence pairs digital wardrobe management, wear analytics, and context-driven outfit planning with OP AI — curating what to wear from your real closet.
          </p>
        </div>

        {/* Action Buttons with comfortable responsive spacing (Part 1 Fix) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 pt-4 w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDemoAccess}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto text-base font-bold px-8 h-14 shadow-lg hover:shadow-[var(--shadow-glow)] transition-all"
          >
            Launch Platform (Demo Mode)
          </Button>

          <Link href="/signup" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base font-bold px-8 h-14 transition-all"
            >
              Create Account & Onboard
            </Button>
          </Link>
        </div>

        {/* Core Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold">
              <Shirt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Digital Wardrobe & Wear Tracking
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Catalog every piece with colors, seasons, and fit. Track wear counts and timestamped event history with one-click logging.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8B9E1]/30 text-[#831843] dark:text-[#E38CD4] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              ✦ OP AI Outfit Recommendation
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Multi-factor intelligence combining occasion fit, personal style affinities, color harmony, and wear rotation balancing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8E9EE]/30 text-[#0891B2] dark:text-[#72DDE3] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Interactive Outfit Planning
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Compose complete looks from real wardrobe items, schedule planned dates, and log entire outfits with a single tap.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-muted)]">
        <p>© 2026 OmniPresence — OP AI Personal Intelligence Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

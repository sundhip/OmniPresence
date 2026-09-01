"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { AppStorage } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CloudSun,
  Calendar,
  Wallet,
  LogOut,
  User,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { success, error: toastError } = useToast();

  const handleExportData = () => {
    if (!user) return;
    try {
      const json = AppStorage.exportUserData(user.id);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omnipresence_${user.name.toLowerCase().replace(/\s+/g, "_")}_data.json`;
      a.click();
      URL.revokeObjectURL(url);
      success("Export Successful", `${user.name}'s wardrobe and outfit data has been downloaded.`);
    } catch (err: any) {
      toastError("Export Failed", err.message);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const ok = AppStorage.importUserData(user.id, content);
          if (ok) {
            success("Data Imported", `Restored wardrobe and profile data for ${user.name}.`);
          } else {
            toastError("Invalid JSON", "Could not parse imported file format.");
          }
        } catch {
          toastError("Import Error", "Failed to read the selected file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetData = () => {
    if (!user) return;
    if (
      confirm(
        `Are you sure you want to reset all data for ${user.name}? This will clear your personal wardrobe items and wear history.`
      )
    ) {
      AppStorage.resetUserToDefault(user.id);
      success("Data Reset Complete", `Reset data for ${user.name}.`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Settings & Account Controls
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Manage application theme, user data backups, and account session.
        </p>
      </div>

      {/* Active Account Banner */}
      {user && (
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Active Authenticated Account
              </p>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {user.name} ({user.email})
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Tops Size: <span className="font-bold text-[var(--primary)]">{user.sizes?.tops || "M"}</span> • Fit: <span className="font-bold">{user.fitPreference || "Regular"}</span>
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut()}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      )}

      {/* Theme Selection */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Sun className="w-4 h-4 text-[var(--primary)]" />
          Appearance & Theme System
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Choose between Light, Dark, or automatic system appearance. Theme choices persist across sessions.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
              theme === "light"
                ? "bg-[var(--surface-elevated)] border-[var(--primary)] text-[var(--primary)] shadow-sm font-bold scale-[1.02]"
                : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            <Sun className="w-5 h-5 text-[#FBBF24]" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
              theme === "dark"
                ? "bg-[var(--surface-elevated)] border-[var(--primary)] text-[var(--primary)] shadow-sm font-bold scale-[1.02]"
                : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            <Moon className="w-5 h-5 text-[#6657D9]" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
              theme === "system"
                ? "bg-[var(--surface-elevated)] border-[var(--primary)] text-[var(--primary)] shadow-sm font-bold scale-[1.02]"
                : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            <Monitor className="w-5 h-5 text-[var(--text-primary)]" />
            <span className="text-xs">System (Auto)</span>
          </button>
        </div>
      </div>

      {/* Data Management: Export / Import / Reset */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-[var(--primary)]" />
          Data Portability & Management (User-Scoped)
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Export your personal wardrobe catalog, wear logs, and outfit plans as standard JSON or reset your data.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportData}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export My Data (JSON)
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] shadow-[var(--shadow-subtle)] transition-all">
              <Upload className="w-4 h-4" />
              Import Data (JSON)
            </span>
          </label>

          <Button
            variant="danger"
            size="md"
            onClick={handleResetData}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset My Wardrobe Data
          </Button>
        </div>
      </div>

      {/* Phase 2+ Connected Services Extension Previews */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          Connected Intelligence Services (Phase 2 Preview)
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          These services are architected as modular extension points for Phase 2 integration.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <CloudSun className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Weather Context Engine (OpenWeather API)
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Real-time temperature and forecast context for intelligent fabric recommendations.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
              Phase 2
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Google Calendar & Schedule Understanding
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Automatic event schedule sync and proactive dress code preparation.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
              Phase 2
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Wardrobe Financial Intelligence & &quot;Do I Need This?&quot;
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Cost-per-wear analytics and purchase duplication warnings.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
              Phase 2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

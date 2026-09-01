"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { AppStorage } from "@/lib/storage";
import { marketplaceService } from "@/services/marketplaceService";
import { MarketplaceProviderStatus, MarketplaceProviderTestResult } from "@/types/marketplace";
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
  ShoppingBag,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Marketplace Providers Health State
  const [providerStatuses, setProviderStatuses] = useState<MarketplaceProviderStatus[]>([]);
  const [isTestingProviders, setIsTestingProviders] = useState(false);
  const [testResults, setTestResults] = useState<{
    amazon?: MarketplaceProviderTestResult;
    flipkart?: MarketplaceProviderTestResult;
  } | null>(null);

  const fetchStatuses = async () => {
    try {
      const data = await marketplaceService.getProviderStatus();
      setProviderStatuses(data.providers);
    } catch {
      // Background load silent note
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleRunDiagnostic = async () => {
    setIsTestingProviders(true);
    try {
      const res = await marketplaceService.testProviders();
      setTestResults(res.results);
      await fetchStatuses();
      if (res.anyConnected) {
        success("Diagnostic Complete", res.summary);
      } else {
        toastError("No Live Providers Connected", "Configure API credentials in .env.local.");
      }
    } catch (err: any) {
      toastError("Diagnostic Failed", err.message);
    } finally {
      setIsTestingProviders(false);
    }
  };

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
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Settings & Account Controls
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Manage application theme, retail marketplace integrations, and data backups.
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
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{user.name}</h2>
              <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/20">
            Active Session
          </span>
        </div>
      )}

      {/* Theme Selection */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Sun className="w-4 h-4 text-[var(--primary)]" />
          Interface Theme & Appearance
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Select your visual appearance preference.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
              theme === "light"
                ? "bg-[var(--surface-elevated)] border-[var(--primary)] text-[var(--primary)] shadow-sm font-bold scale-[1.02]"
                : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            <Sun className="w-5 h-5 text-[#F59E0B]" />
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

      {/* Marketplace Shopping Providers Diagnostic Panel */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Retail Shopping Providers & API Health Diagnostics
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunDiagnostic}
            isLoading={isTestingProviders}
            leftIcon={<Activity className="w-3.5 h-3.5" />}
          >
            Run Live Diagnostic Test
          </Button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          Inspect live authentication status for official retail marketplace APIs (Amazon PA-API 5.0 and Flipkart Affiliate).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Amazon Status Card */}
          {(() => {
            const amzStatus = providerStatuses.find((p) => p.provider === "Amazon");
            const amzTest = testResults?.amazon;
            const isConfigured = amzStatus?.isConfigured || false;
            const isHealthy = amzTest ? amzTest.passed : amzStatus?.isConnected;

            return (
              <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF9900]" />
                    <span className="font-bold text-sm text-[var(--text-primary)]">Amazon PA-API 5.0</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isHealthy
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : isConfigured
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}
                  >
                    {isHealthy ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </>
                    ) : isConfigured ? (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Configured
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Not Configured
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-snug">
                  {amzTest?.errorMessage || amzStatus?.message || "AWS SigV4 Signed Product Advertising API."}
                </p>

                {amzTest && (
                  <div className="text-[11px] font-mono p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-[var(--text-primary)]">{amzTest.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>{amzTest.latencyMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test Items:</span>
                      <span>{amzTest.productCount} returned</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Flipkart Status Card */}
          {(() => {
            const fkStatus = providerStatuses.find((p) => p.provider === "Flipkart");
            const fkTest = testResults?.flipkart;
            const isConfigured = fkStatus?.isConfigured || false;
            const isHealthy = fkTest ? fkTest.passed : fkStatus?.isConnected;

            return (
              <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#2874F0]" />
                    <span className="font-bold text-sm text-[var(--text-primary)]">Flipkart Affiliate API</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isHealthy
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : isConfigured
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}
                  >
                    {isHealthy ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </>
                    ) : isConfigured ? (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Configured
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Not Configured
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-snug">
                  {fkTest?.errorMessage || fkStatus?.message || "Flipkart Affiliate Product Search & Feed API."}
                </p>

                {fkTest && (
                  <div className="text-[11px] font-mono p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-[var(--text-primary)]">{fkTest.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>{fkTest.latencyMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Test Items:</span>
                      <span>{fkTest.productCount} returned</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

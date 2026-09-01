"use client";

import React from "react";
import { RecommendationCandidate } from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  CloudSun,
  Lightbulb,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import { getColorHex } from "@/lib/utils";

export interface RecommendationCardProps {
  candidate: RecommendationCandidate;
  weather?: WeatherContext;
  isPrimary?: boolean;
  onUseOutfit: (candidate: RecommendationCandidate) => void;
  onRegenerate?: () => void;
}

export function RecommendationCard({
  candidate,
  weather,
  isPrimary = true,
  onUseOutfit,
  onRegenerate,
}: RecommendationCardProps) {
  const { breakdown, carryItems } = candidate;

  return (
    <div
      className={`rounded-3xl p-6 border transition-all duration-300 ${
        isPrimary
          ? "border-[var(--primary)] bg-[var(--surface-elevated)] shadow-[var(--shadow-glow)]"
          : "border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)] font-bold shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {isPrimary ? "Best Match by OP AI" : "Alternative Curation"}
              </span>
              <Badge variant="primary" size="sm">
                {candidate.occasionMatch}
              </Badge>
              {(weather || candidate.weatherNote) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] text-[10px] font-semibold border border-[var(--border-subtle)]">
                  <CloudSun className="w-3 h-3 text-[#38BDF8]" />
                  <span>
                    {weather
                      ? `${weather.temperature}°C • ${weather.condition}`
                      : candidate.weatherNote}
                  </span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight mt-0.5">
              {candidate.name}
            </h3>
          </div>
        </div>

        {/* Compatibility Gauge */}
        <div className="flex items-center gap-3 bg-[var(--surface-soft)] px-3.5 py-1.5 rounded-2xl border border-[var(--border-subtle)]">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Match Score
            </p>
            <p className="text-base font-extrabold text-[var(--primary)] leading-none mt-0.5">
              {candidate.score}%
            </p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-tr from-[var(--primary)] to-[var(--accent-lavender)] text-white text-xs font-black shadow-sm">
            {candidate.score}
          </div>
        </div>
      </div>

      {/* WEAR Section */}
      <div className="my-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <span>WEAR ({candidate.items.length} PIECES)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {candidate.items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl p-2.5 bg-[var(--surface-soft)] border border-[var(--border)] overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)] mb-2 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />
                <span
                  className="absolute top-2 left-2 w-3 h-3 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: getColorHex(item.color) }}
                  title={`Color: ${item.color}`}
                />
                <span className="absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white">
                  {item.category}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {item.brand || item.subcategory} • {item.wearCount} wears
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TAKE WITH YOU (Carry / Accessory recommendations) */}
      {carryItems && carryItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
              TAKE WITH YOU
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {carryItems.map((carry, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs shadow-2xs"
              >
                <span className="text-base">{carry.icon || "🎒"}</span>
                <div>
                  <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                    <span>{carry.name}</span>
                    {carry.fromWardrobe && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--primary-soft)] text-[var(--primary)] font-bold">
                        In Wardrobe
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">{carry.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why This Works (Explainability) & Multi-Factor Intelligence Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] mb-5">
        {/* Rationale & Styling Tips */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              Why this works
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {candidate.rationale.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-[var(--primary)] font-bold">•</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: r.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-[var(--text-primary)]">$1</strong>'
                      ),
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {candidate.stylingTips && candidate.stylingTips.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <p className="text-[11px] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-[#EAB308]" />
                <span>Styling Detail:</span>
              </p>
              <p className="text-xs text-[var(--text-secondary)] italic">
                {candidate.stylingTips[0]}
              </p>
            </div>
          )}
        </div>

        {/* Multi-Factor Score Distribution */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
            Intelligence Breakdown
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-0.5">
                <span>Occasion Fit (25%)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {breakdown.occasionFit}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full"
                  style={{ width: `${breakdown.occasionFit}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-0.5">
                <span>Preference & Fit Match (20%)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {breakdown.preferenceMatch}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B74EC] rounded-full"
                  style={{ width: `${breakdown.preferenceMatch}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-0.5">
                <span className="flex items-center gap-1">
                  <span>Weather Comfort (20%)</span>
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {breakdown.weatherCompatibility ?? 85}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#38BDF8] rounded-full"
                  style={{ width: `${breakdown.weatherCompatibility ?? 85}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-0.5">
                <span>Color Compatibility (15%)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {breakdown.colorCompatibility}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C8B5FF] rounded-full"
                  style={{ width: `${breakdown.colorCompatibility}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[var(--text-secondary)] mb-0.5">
                <span>Wear Rotation Balance (10%)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {breakdown.recentWearBalance}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--success)] rounded-full"
                  style={{ width: `${breakdown.recentWearBalance}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3">
        {onRegenerate && (
          <Button variant="secondary" size="md" onClick={onRegenerate}>
            Try Another Match
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          onClick={() => onUseOutfit(candidate)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Use This Outfit
        </Button>
      </div>
    </div>
  );
}

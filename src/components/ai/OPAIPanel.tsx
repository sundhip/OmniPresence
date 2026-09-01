"use client";

import React, { useState, useEffect } from "react";
import { RecommendationCandidate, RecommendationResponse } from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";
import { RecommendationCard } from "./RecommendationCard";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { recommendationService } from "@/services/recommendationService";
import { weatherService } from "@/services/weatherService";
import { useToast } from "@/context/ToastContext";
import { Sparkles, Loader2, Wand2, ShieldCheck, CloudSun } from "lucide-react";

export interface OPAIPanelProps {
  onSelectOutfit?: (candidate: RecommendationCandidate) => void;
  defaultOccasion?: string;
}

const QUICK_PROMPTS = [
  "Office Meeting",
  "Casual Friday",
  "Dinner Date",
  "Executive Briefing",
  "Weekend Brunch",
  "Airport Travel",
];

export function OPAIPanel({
  onSelectOutfit,
  defaultOccasion = "Office Meeting",
}: OPAIPanelProps) {
  const { success, error: toastError } = useToast();
  const [occasion, setOccasion] = useState(defaultOccasion);
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);

  useEffect(() => {
    weatherService.getWeatherContext().then(setWeather).catch(console.warn);
  }, []);

  const loadingMessages = [
    "Analyzing your digital wardrobe...",
    weather
      ? `Calibrating with today's ${weather.temperature}°C ${weather.condition.toLowerCase()} weather in ${weather.location.split(",")[0]}...`
      : "Evaluating style preferences & color harmonies...",
    "Balancing recent wear distribution...",
    "Generating optimal OP AI ensemble...",
  ];

  const handleGenerate = async (targetOccasion: string = occasion) => {
    if (!targetOccasion.trim()) {
      toastError("Please enter or select an occasion");
      return;
    }

    setIsLoading(true);
    setLoadingStage(0);

    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % loadingMessages.length);
    }, 450);

    try {
      const res = await recommendationService.getOutfitRecommendation({
        occasion: targetOccasion.trim(),
        notes: notes.trim() || undefined,
        weather: weather || undefined,
      });
      setResponse(res);
      success("OP AI Recommendation Ready", `Curated match for ${targetOccasion}.`);
    } catch (err: any) {
      toastError("Recommendation Error", err.message);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-6 sm:p-8 border space-y-6"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* OP AI Header & Weather Context Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6657D9] via-[#8B74EC] to-[#C8B5FF] text-white shadow-md shadow-[#6657D9]/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                ✦ OP AI Recommendation Engine
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                v1.1 Weather-Aware
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Intelligent context-driven outfit curation powered by your wardrobe and live weather.
            </p>
          </div>
        </div>

        {/* Live Weather Compact Badge */}
        {weather ? (
          <WeatherCard
            weather={weather}
            onWeatherChange={(w) => setWeather(w)}
            compact={true}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface-soft)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
            <span>Local Rule Fallback Active</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            What occasion are you dressing for?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Executive Meeting, Casual Studio Session, Date Night..."
                className="h-12 text-sm rounded-2xl"
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleGenerate(occasion)}
              isLoading={isLoading}
              leftIcon={<Wand2 className="w-4 h-4" />}
            >
              Generate Recommendation
            </Button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Quick Inquiries:
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setOccasion(prompt);
                  handleGenerate(prompt);
                }}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] transition-all cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Stage Display */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-[var(--surface-soft)] border border-[var(--border)] text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              ✦ OP AI is curating your look
            </p>
            <p className="text-xs text-[var(--primary)] font-medium mt-1 animate-pulse">
              {loadingMessages[loadingStage]}
            </p>
          </div>
        </div>
      )}

      {/* Recommendation Results */}
      {!isLoading && response && (
        <div className="space-y-6 animate-fade-in">
          {/* Primary Match */}
          <RecommendationCard
            candidate={response.primary}
            weather={response.weather || weather || undefined}
            isPrimary={true}
            onUseOutfit={(cand) => onSelectOutfit && onSelectOutfit(cand)}
            onRegenerate={() => handleGenerate(occasion)}
          />

          {/* Alternatives Carousel / Grid */}
          {response.alternatives && response.alternatives.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Alternative Ensembles for {response.primary.occasionMatch}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.alternatives.map((alt) => (
                  <RecommendationCard
                    key={alt.id}
                    candidate={alt}
                    weather={response.weather || weather || undefined}
                    isPrimary={false}
                    onUseOutfit={(cand) => onSelectOutfit && onSelectOutfit(cand)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

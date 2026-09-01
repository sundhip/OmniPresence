"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { PopulatedOutfit } from "@/types/outfit";
import { RecommendationResponse } from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";
import { wardrobeService } from "@/services/wardrobeService";
import { outfitService } from "@/services/outfitService";
import { recommendationService } from "@/services/recommendationService";
import { weatherService } from "@/services/weatherService";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { WardrobeFormModal } from "@/components/wardrobe/WardrobeFormModal";
import { WeatherCard } from "@/components/weather/WeatherCard";
import {
  Sparkles,
  Shirt,
  Layers,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Heart,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<PopulatedOutfit[]>([]);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const items = await wardrobeService.getItems();
      const populatedOutfits = await outfitService.getAllPopulatedOutfits();
      const weatherData = await weatherService.getWeatherContext();

      setWardrobe(items);
      setOutfits(populatedOutfits);
      setWeather(weatherData);

      // Load weather-aware recommendation
      if (items.length > 0) {
        const rec = await recommendationService.getOutfitRecommendation({
          occasion: "Office Meeting",
          weather: weatherData,
        });
        setRecommendation(rec);
      }
    } catch (e) {
      console.error("Dashboard loading error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleWeatherChange = async (updatedWeather: WeatherContext) => {
    setWeather(updatedWeather);
    if (wardrobe.length > 0) {
      try {
        const rec = await recommendationService.getOutfitRecommendation({
          occasion: "Office Meeting",
          weather: updatedWeather,
        });
        setRecommendation(rec);
      } catch (e) {
        console.warn("Weather updated rec error:", e);
      }
    }
  };

  // Derived dynamic metrics
  const totalItems = wardrobe.length;
  const mostWornItem = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount)[0];
  const recentlyAdded = [...wardrobe].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const upcomingOutfit = outfits.find((o) => o.date) || outfits[0];
  const favoriteItems = wardrobe.filter((i) => i.favorite);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Greeting, Weather Badge & OP AI Actions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[var(--surface-elevated)] via-[var(--surface)] to-[var(--surface-soft)] border border-[var(--border)] shadow-[var(--shadow-card)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OP AI Personal Intelligence</span>
            </div>
            {weather && (
              <WeatherCard
                weather={weather}
                onWeatherChange={handleWeatherChange}
                compact={true}
              />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {getGreeting()}, {user?.name || "Alex"}.
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Your wardrobe contains <strong>{totalItems} cataloged pieces</strong>.{" "}
            {weather ? (
              <span>
                Today&apos;s <strong>{weather.temperature}°C {weather.condition.toLowerCase()}</strong> conditions in {weather.location.split(",")[0]} are calibrated with your {user?.stylePreferences?.[0] || "smart-casual"} aesthetics.
              </span>
            ) : (
              <span>Your rotation balance is in healthy alignment for today.</span>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Clothing
          </Button>
          <Link href="/outfits/new">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-white animate-pulse" />}
            >
              Ask OP AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Wardrobe */}
        <Link href="/wardrobe" className="block">
          <Card variant="interactive" className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Wardrobe Items
              </span>
              <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                <Shirt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                {totalItems}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Across 6 core categories
              </p>
            </div>
          </Card>
        </Link>

        {/* Metric 2: Most Worn Piece */}
        <Card className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Most Worn Piece
            </span>
            <div className="w-8 h-8 rounded-xl bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-sm font-extrabold text-[var(--text-primary)] truncate">
              {mostWornItem ? mostWornItem.name : "None yet"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {mostWornItem ? `${mostWornItem.wearCount} recorded wears` : "Log wears to see"}
            </p>
          </div>
        </Card>

        {/* Metric 3: Recently Added */}
        <Card className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Recently Added
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8B9E1]/30 text-[#831843] dark:text-[#E38CD4] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-sm font-extrabold text-[var(--text-primary)] truncate">
              {recentlyAdded ? recentlyAdded.name : "None yet"}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {recentlyAdded ? recentlyAdded.category : "Add your first piece"}
            </p>
          </div>
        </Card>

        {/* Metric 4: Active Planned Outfits */}
        <Link href="/outfits" className="block">
          <Card variant="interactive" className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Planned Outfits
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#B8E9EE]/30 text-[#0891B2] dark:text-[#72DDE3] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                {outfits.length}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Ready for schedule execution
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid: Featured OP AI Recommendation + Planned Outfit & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Featured Weather-Aware OP AI Curation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              Featured OP AI Curation
            </h2>
            <Link
              href="/outfits/new"
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              Ask custom occasion <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recommendation ? (
            <RecommendationCard
              candidate={recommendation.primary}
              weather={weather || undefined}
              isPrimary={true}
              onUseOutfit={() => {
                router.push("/outfits/new");
              }}
            />
          ) : (
            <div className="p-8 text-center bg-[var(--surface)] rounded-3xl border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                Add clothing items to generate OP AI recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Weather Context Card & Upcoming Planned Look (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Weather Card */}
          <WeatherCard
            weather={weather}
            onWeatherChange={handleWeatherChange}
          />

          {/* Upcoming Outfit Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--primary)]" />
                Upcoming Planned Look
              </h2>
              <Link
                href="/outfits"
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                View all
              </Link>
            </div>

            {upcomingOutfit ? (
              <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="primary" size="sm">
                      {upcomingOutfit.occasion}
                    </Badge>
                    <h3 className="text-base font-extrabold text-[var(--text-primary)] mt-1">
                      {upcomingOutfit.name}
                    </h3>
                  </div>
                  {upcomingOutfit.date && (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {formatDate(upcomingOutfit.date)}
                    </span>
                  )}
                </div>

                {/* Items preview */}
                <div className="grid grid-cols-4 gap-2">
                  {upcomingOutfit.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square rounded-xl overflow-hidden bg-[var(--surface-soft)] border border-[var(--border)] relative"
                      title={item.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <Link href={`/outfits`}>
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    Manage Planned Outfits
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 text-center rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">No upcoming outfit planned yet.</p>
                <Link href="/outfits/new">
                  <Button variant="primary" size="sm">
                    Plan an Outfit
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Favorite Wardrobe Pieces */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                Favorite Pieces ({favoriteItems.length})
              </h2>
              <Link
                href="/wardrobe"
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Wardrobe
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {favoriteItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/wardrobe/${item.id}`}
                  className="group rounded-2xl p-2 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all text-center"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[var(--surface-soft)] mb-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {item.wearCount} wears
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Add Clothing Modal */}
      <WardrobeFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadDashboardData}
      />
    </div>
  );
}

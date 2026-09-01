"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { WardrobeItem } from "@/types/wardrobe";
import { PopulatedOutfit } from "@/types/outfit";
import { RecommendationResponse } from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";
import { EventItem } from "@/types/events";
import { FinancialPlan } from "@/types/finance";
import { wardrobeService } from "@/services/wardrobeService";
import { outfitService } from "@/services/outfitService";
import { recommendationService } from "@/services/recommendationService";
import { weatherService } from "@/services/weatherService";
import { calendarService } from "@/services/calendarService";
import { financeService } from "@/services/financeService";
import { remindersService } from "@/services/remindersService";
import { TransportationEngine } from "@/lib/transportationEngine";
import { ReadinessEngine } from "@/lib/readinessEngine";
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
  Train,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Bot,
  Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<PopulatedOutfit[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [items, populatedOutfits, weatherData, evList, fPlan] = await Promise.all([
        wardrobeService.getItems(),
        outfitService.getAllPopulatedOutfits(),
        weatherService.getWeatherContext().catch(() => null),
        calendarService.getEvents().catch(() => []),
        financeService.getFinancialPlan().catch(() => null),
      ]);

      setWardrobe(items);
      setOutfits(populatedOutfits);
      setWeather(weatherData);
      setEvents(evList);
      setFinancialPlan(fPlan);

      // Load weather-aware recommendation
      if (items.length > 0) {
        const rec = await recommendationService.getOutfitRecommendation({
          occasion: "Office Meeting",
          weather: weatherData || undefined,
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

  // Derived dynamic metrics & suggestions (Feature 17)
  const totalItems = wardrobe.length;
  const mostWornItem = [...wardrobe].sort((a, b) => b.wearCount - a.wearCount)[0];
  const recentlyAdded = [...wardrobe].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const upcomingOutfit = outfits.find((o) => o.date) || outfits[0];
  const favoriteItems = wardrobe.filter((i) => i.favorite);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEvent = events.find((e) => e.date === todayStr) || events.sort((a, b) => a.date.localeCompare(b.date))[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
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
          <Link href="/assistant">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Bot className="w-4 h-4 text-white" />}
            >
              Ask OP AI
            </Button>
          </Link>
        </div>
      </div>

      {/* FEATURE 17: OP AI HOME SUGGESTIONS SPOTLIGHT */}
      {todayEvent && (() => {
        const transit = TransportationEngine.calculateTransitOptions(
          todayEvent.originLocation || "Tambaram",
          todayEvent.location || "Venue",
          todayEvent.time || "10:00",
          20
        );
        const readiness = ReadinessEngine.calculateEventReadiness(todayEvent, wardrobe);

        return (
          <div className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/30 shadow-[var(--shadow-card)] space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    OP AI Daily Intelligence &amp; Schedule Spotlight
                  </h2>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Personalized context for your schedule today
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  readiness.status === "READY"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : readiness.status === "ALMOST READY"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                }`}
              >
                {readiness.status === "READY" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                Readiness: {readiness.score}% ({readiness.status})
              </span>
            </div>

            {/* Smart Contextual Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* Event & Time */}
              <div className="p-4 rounded-2xl bg-[var(--surface-soft)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--primary)]" /> Scheduled Event
                </span>
                <p className="font-bold text-sm text-[var(--text-primary)]">
                  {todayEvent.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {todayEvent.time} at {todayEvent.location}
                </p>
              </div>

              {/* Outfit Recommendation */}
              <div className="p-4 rounded-2xl bg-[var(--surface-soft)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Shirt className="w-3 h-3 text-[var(--primary)]" /> Recommended Outfit
                </span>
                <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {todayEvent.plannedOutfit?.topItemName || "Navy Formal / Oxford Shirt"}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Calibrated for {weather?.temperature || 28}°C {weather?.condition || "warm"} weather
                </p>
              </div>

              {/* Transit & Departure */}
              <div className="p-4 rounded-2xl bg-[var(--surface-soft)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                  <Train className="w-3 h-3 text-emerald-500" /> Fastest Transit &amp; Departure
                </span>
                <p className="font-bold text-sm text-[var(--text-primary)]">
                  {transit.recommendedOption.name} ({transit.recommendedOption.durationMinutes}m)
                </p>
                <p className="text-[11px] text-emerald-600 font-bold">
                  Leave by {transit.recommendedDepartureTime}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href={`/calendar/${todayEvent.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
              >
                View full preparation checklist &amp; transit routes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        );
      })()}

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

        {/* Metric 2: Schedule & Events */}
        <Link href="/calendar" className="block">
          <Card variant="interactive" className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Schedule &amp; Events
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 min-w-0">
              <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                {events.length}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {events.length} active schedule items
              </p>
            </div>
          </Card>
        </Link>

        {/* Metric 3: Most Worn Piece */}
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

        {/* Metric 4: Financial Budget */}
        <Link href="/finance" className="block">
          <Card variant="interactive" className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Remaining Budget
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-black text-emerald-500">
                ₹{Math.max(0, (financialPlan?.monthlyFashionBudget || 5000) - (financialPlan?.spentThisMonth || 3800)).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Of ₹{(financialPlan?.monthlyFashionBudget || 5000).toLocaleString()} monthly budget
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

"use client";

import React, { useState, useEffect } from "react";
import { WeatherContext, WeatherCondition } from "@/types/weather";
import { weatherService } from "@/services/weatherService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSun,
  CloudLightning,
  CloudSnow,
  Wind,
  MapPin,
  RefreshCw,
  Droplets,
  Thermometer,
  Sparkles,
  Check,
  Compass,
} from "lucide-react";

export interface WeatherCardProps {
  weather?: WeatherContext | null;
  onWeatherChange?: (updated: WeatherContext) => void;
  className?: string;
  compact?: boolean;
}

const COMMON_CITIES = [
  "Bengaluru, India",
  "Mumbai, India",
  "New Delhi, India",
  "Chennai, India",
  "New York, USA",
  "London, UK",
  "Paris, France",
  "Tokyo, Japan",
  "San Francisco, USA",
];

export function WeatherCard({
  weather: initialWeather,
  onWeatherChange,
  className = "",
  compact = false,
}: WeatherCardProps) {
  const { success, error: toastError } = useToast();
  const [weather, setWeather] = useState<WeatherContext | null>(initialWeather || null);
  const [isLoading, setIsLoading] = useState(!initialWeather);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const loadWeather = async (targetLocation?: string, force: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await weatherService.getWeatherContext(targetLocation, force);
      setWeather(data);
      if (onWeatherChange) onWeatherChange(data);
    } catch (e: any) {
      console.warn("Weather card load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialWeather) {
      loadWeather();
    } else {
      setWeather(initialWeather);
    }
  }, [initialWeather]);

  const handleSelectCity = async (city: string) => {
    weatherService.setUserLocation(city);
    setIsModalOpen(false);
    await loadWeather(city, true);
    success("Location Updated", `Weather updated for ${city}.`);
  };

  const handleCustomCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCity.trim()) return;
    const city = customCity.trim();
    weatherService.setUserLocation(city);
    setCustomCity("");
    setIsModalOpen(false);
    await loadWeather(city, true);
    success("Location Updated", `Weather updated for ${city}.`);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const detected = await weatherService.detectBrowserLocation();
      if (detected) {
        setIsModalOpen(false);
        await loadWeather(detected, true);
        success("Location Detected", `Loaded weather for ${detected}.`);
      } else {
        toastError(
          "Location Unavailable",
          "Could not detect location automatically. Please select a city manually."
        );
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const getWeatherIcon = (condition?: WeatherCondition) => {
    switch (condition) {
      case "Sunny":
      case "Clear":
        return <Sun className="w-5 h-5 text-[#FBBF24] animate-spin-slow" />;
      case "Partly Cloudy":
        return <CloudSun className="w-5 h-5 text-[#38BDF8]" />;
      case "Cloudy":
        return <Cloud className="w-5 h-5 text-[#94A3B8]" />;
      case "Rainy":
        return <CloudRain className="w-5 h-5 text-[#0284C7]" />;
      case "Stormy":
        return <CloudLightning className="w-5 h-5 text-[#7C3AED]" />;
      case "Snowy":
        return <CloudSnow className="w-5 h-5 text-[#E0E7FF]" />;
      case "Windy":
        return <Wind className="w-5 h-5 text-[#64748B]" />;
      default:
        return <CloudSun className="w-5 h-5 text-[#38BDF8]" />;
    }
  };

  if (compact && weather) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-xs ${className}`}
      >
        {getWeatherIcon(weather.condition)}
        <span className="font-bold text-[var(--text-primary)]">
          {weather.temperature}°C
        </span>
        <span className="text-[var(--text-muted)]">•</span>
        <span className="text-[var(--text-secondary)] truncate max-w-[110px]">
          {weather.location.split(",")[0]}
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-bold text-[var(--primary)] hover:underline ml-1 cursor-pointer"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`rounded-3xl p-5 border transition-all relative overflow-hidden bg-gradient-to-br from-[var(--surface)] to-[var(--surface-soft)] border-[var(--border)] shadow-[var(--shadow-card)] ${className}`}
      >
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] rounded-full blur-2xl pointer-events-none opacity-40" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Weather Context
            </span>
            {weather?.isCached && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                Cached
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer px-2 py-0.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <MapPin className="w-3 h-3" />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => loadWeather(undefined, true)}
              title="Refresh weather"
              disabled={isLoading}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Weather Body */}
        {isLoading && !weather ? (
          <div className="py-6 text-center space-y-2 relative z-10 animate-pulse">
            <p className="text-xs text-[var(--text-muted)]">Checking local weather...</p>
          </div>
        ) : weather ? (
          <div className="pt-3 space-y-3 relative z-10">
            {/* Main Temperature & Condition */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                    {weather.temperature}°C
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    Feels {weather.feelsLike}°C
                  </span>
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                  <span>{weather.condition}</span>
                  <span className="text-[var(--text-muted)] font-normal">•</span>
                  <span className="text-[var(--text-muted)] font-normal">{weather.precipitation}</span>
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shadow-xs">
                {getWeatherIcon(weather.condition)}
              </div>
            </div>

            {/* Location & Secondary Metrics */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1 font-semibold text-[var(--text-primary)] truncate max-w-[160px]">
                <MapPin className="w-3 h-3 text-[var(--primary)] flex-shrink-0" />
                <span className="truncate">{weather.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#38BDF8]" />
                  {weather.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[var(--text-muted)]" />
                  {weather.windSpeed} km/h
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-5 text-center space-y-2 relative z-10">
            <p className="text-xs text-[var(--text-muted)]">Weather information isn&apos;t available right now.</p>
            <Button variant="ghost" size="sm" onClick={() => loadWeather(undefined, true)}>
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Location Change Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Weather Location"
        description="Choose your city to calibrate temperature and weather-aware outfit recommendations."
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Geolocation Button */}
          <Button
            variant="secondary"
            size="md"
            className="w-full justify-center"
            onClick={handleDetectLocation}
            isLoading={isDetectingLocation}
            leftIcon={<Compass className="w-4 h-4 text-[var(--primary)]" />}
          >
            Use My Current Device Location
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border-subtle)] w-full" />
            <span className="bg-[var(--surface)] px-3 text-[10px] uppercase font-bold text-[var(--text-muted)] absolute">
              or choose city
            </span>
          </div>

          {/* Quick Cities Grid */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Popular Cities:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_CITIES.map((city) => {
                const isSelected =
                  weather?.location.toLowerCase().includes(city.split(",")[0].toLowerCase());
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <span className="truncate">{city.split(",")[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Search Form */}
          <form onSubmit={handleCustomCitySubmit} className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Search Any City / Region:
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. San Francisco, Tokyo, Sydney..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="primary" size="md">
                Set City
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

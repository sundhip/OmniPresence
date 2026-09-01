"use client";

import React, { useState } from "react";
import { WardrobeCategory, WardrobeFilterOptions, Season } from "@/types/wardrobe";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Search, SlidersHorizontal, ArrowUpDown, X, Heart } from "lucide-react";
import { PRIMARY_COLORS, EXTENDED_COLORS } from "@/lib/colorVocabulary";
import { getColorHex } from "@/lib/utils";

const CATEGORIES: (WardrobeCategory | "All")[] = [
  "All",
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
];

const ALL_FILTER_COLORS = [...PRIMARY_COLORS, ...EXTENDED_COLORS];

const AVAILABLE_SEASONS: Season[] = ["Spring", "Summer", "Autumn", "Winter", "All-Season"];

const AVAILABLE_OCCASIONS = [
  "Office",
  "Meeting",
  "Casual",
  "Everyday",
  "Weekend Casual",
  "Dinner",
  "Date",
  "Party",
  "Formal Event",
  "Travel",
  "Workout",
];

export interface WardrobeFiltersProps {
  filters: WardrobeFilterOptions;
  onChange: (filters: WardrobeFilterOptions) => void;
  categoryCounts?: Record<string, number>;
}

export function WardrobeFilters({
  filters,
  onChange,
  categoryCounts = {},
}: WardrobeFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const tabs = CATEGORIES.map((cat) => ({
    id: cat,
    label: cat,
    count: categoryCounts[cat] || (cat === "All" ? categoryCounts["all_total"] : 0),
  }));

  const handleCategoryChange = (catId: string) => {
    onChange({ ...filters, category: catId as WardrobeCategory | "All" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sortBy: e.target.value as any });
  };

  const toggleColor = (color: string) => {
    const current = filters.colors || [];
    const updated = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color];
    onChange({ ...filters, colors: updated });
  };

  const toggleSeason = (season: Season) => {
    const current = filters.seasons || [];
    const updated = current.includes(season)
      ? current.filter((s) => s !== season)
      : [...current, season];
    onChange({ ...filters, seasons: updated });
  };

  const toggleOccasion = (occasion: string) => {
    const current = filters.occasions || [];
    const updated = current.includes(occasion)
      ? current.filter((o) => o !== occasion)
      : [...current, occasion];
    onChange({ ...filters, occasions: updated });
  };

  const clearAllFilters = () => {
    onChange({
      category: "All",
      searchQuery: "",
      colors: [],
      seasons: [],
      occasions: [],
      favoriteOnly: false,
      wearFrequency: "all",
      sortBy: "recentlyAdded",
    });
  };

  const hasActiveFilters = Boolean(
    (filters.category && filters.category !== "All") ||
      filters.searchQuery ||
      (filters.colors && filters.colors.length > 0) ||
      (filters.seasons && filters.seasons.length > 0) ||
      (filters.occasions && filters.occasions.length > 0) ||
      filters.favoriteOnly ||
      (filters.wearFrequency && filters.wearFrequency !== "all")
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Top Row: Search + Sort + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={filters.searchQuery || ""}
            onChange={handleSearchChange}
            placeholder="Search by item name, category, color, brand, or occasion..."
            className="w-full h-11 pl-10 pr-10 text-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] shadow-[var(--shadow-subtle)] transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: "" })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Sorting */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)] pointer-events-none" />
            <select
              value={filters.sortBy || "recentlyAdded"}
              onChange={handleSortChange}
              className="h-11 pl-8 pr-8 text-xs font-semibold rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--primary)] shadow-[var(--shadow-subtle)]"
            >
              <option value="recentlyAdded">Recently Added</option>
              <option value="recentlyWorn">Recently Worn</option>
              <option value="mostWorn">Most Worn</option>
              <option value="leastWorn">Least Worn</option>
              <option value="nameAsc">Name (A-Z)</option>
              <option value="nameDesc">Name (Z-A)</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={isAdvancedOpen || hasActiveFilters ? "primary" : "secondary"}
            size="md"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white ml-1" />
            )}
          </Button>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} title="Reset filters">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={filters.category || "All"}
        onChange={handleCategoryChange}
      />

      {/* Advanced Filter Drawer */}
      {isAdvancedOpen && (
        <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
              Advanced Filters
            </h4>
            <button
              onClick={() => setIsAdvancedOpen(false)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Filter by Controlled Colors */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Color Palette ({ALL_FILTER_COLORS.length} shades)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_FILTER_COLORS.map((color) => {
                const isSelected = filters.colors?.includes(color);
                return (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter by Occasions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Occasion
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_OCCASIONS.map((occ) => {
                const isSelected = filters.occasions?.includes(occ);
                return (
                  <button
                    key={occ}
                    onClick={() => toggleOccasion(occ)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-2xs"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter by Seasons */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Season
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SEASONS.map((s) => {
                const isSelected = filters.seasons?.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSeason(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] font-bold shadow-2xs"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter by Favorites & Wear Frequency */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={filters.favoriteOnly || false}
                  onChange={(e) => onChange({ ...filters, favoriteOnly: e.target.checked })}
                  className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <Heart className={`w-3.5 h-3.5 ${filters.favoriteOnly ? "text-red-500 fill-current" : ""}`} />
                <span>Favorites Only</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-medium">Rotation:</span>
                <select
                  value={filters.wearFrequency || "all"}
                  onChange={(e) => onChange({ ...filters, wearFrequency: e.target.value as any })}
                  className="text-xs p-1 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="all">All Items</option>
                  <option value="never">Unworn Only (0 wears)</option>
                  <option value="low">Light Rotation (1-3 wears)</option>
                  <option value="medium">Regular (4-9 wears)</option>
                  <option value="high">High Rotation (10+ wears)</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-[var(--primary)] font-bold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WardrobeFilterOptions, WardrobeItem } from "@/types/wardrobe";
import { wardrobeService } from "@/services/wardrobeService";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { WardrobeFilters } from "@/components/wardrobe/WardrobeFilters";
import { WardrobeFormModal } from "@/components/wardrobe/WardrobeFormModal";
import { Button } from "@/components/ui/Button";
import { Plus, Sparkles } from "lucide-react";

function WardrobeContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");
  const initialSearch = searchParams.get("search") || "";

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAction === "new");

  const [filters, setFilters] = useState<WardrobeFilterOptions>({
    category: "All",
    searchQuery: initialSearch,
    colors: [],
    seasons: [],
    occasions: [],
    favoriteOnly: false,
    wearFrequency: "all",
    sortBy: "recentlyAdded",
  });

  const loadData = useCallback(async () => {
    try {
      const allItems = await wardrobeService.getItems();
      // Calculate category counts
      const counts: Record<string, number> = {
        all_total: allItems.length,
      };
      allItems.forEach((i) => {
        counts[i.category] = (counts[i.category] || 0) + 1;
      });
      setCategoryCounts(counts);

      // Fetch filtered items
      const filtered = await wardrobeService.getItems(filters);
      setItems(filtered);
    } catch (e) {
      console.error("Failed to load wardrobe data:", e);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Digital Wardrobe
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage your clothing catalog, colors, wear frequency, and style parameters.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Clothing Piece
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <WardrobeFilters
        filters={filters}
        onChange={setFilters}
        categoryCounts={categoryCounts}
      />

      {/* Wardrobe Grid */}
      <WardrobeGrid
        items={items}
        onRefresh={loadData}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Modal */}
      <WardrobeFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}

export default function WardrobePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-[var(--text-muted)]">Loading wardrobe...</div>}>
      <WardrobeContent />
    </Suspense>
  );
}

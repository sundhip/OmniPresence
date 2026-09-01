"use client";

import React, { useState, useEffect } from "react";
import { WardrobeCategory, WardrobeItem } from "@/types/wardrobe";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { wardrobeService } from "@/services/wardrobeService";
import { Search, Check, Plus } from "lucide-react";
import { getColorHex } from "@/lib/utils";

export interface OutfitItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategory?: WardrobeCategory | "All";
  selectedItemIds: string[];
  onSelectItem: (item: WardrobeItem) => void;
}

export function OutfitItemSelectorModal({
  isOpen,
  onClose,
  targetCategory = "All",
  selectedItemIds,
  onSelectItem,
}: OutfitItemSelectorModalProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<WardrobeCategory | "All">(targetCategory);

  useEffect(() => {
    setSelectedCat(targetCategory);
  }, [targetCategory]);

  useEffect(() => {
    if (isOpen) {
      wardrobeService.getItems().then(setItems);
    }
  }, [isOpen]);

  const categories: (WardrobeCategory | "All")[] = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Shoes",
    "Accessories",
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCat === "All" || item.category === selectedCat;
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Wardrobe Item"
      description="Choose a piece from your wardrobe to incorporate into your outfit."
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Search & Category Filter */}
        <div className="space-y-3">
          <Input
            placeholder="Search wardrobe pieces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCat === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[55vh] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className={`group relative rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]/40 shadow-sm"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-soft)]"
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface-soft)] mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[var(--primary)] text-white shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white"
                      style={{ backgroundColor: getColorHex(item.color) }}
                    />
                    <Badge variant="secondary" size="sm" className="bg-black/60 text-white text-[9px] py-0 px-1 border-0">
                      {item.category}
                    </Badge>
                  </div>
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
            );
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)]">
              No items match this search or category.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

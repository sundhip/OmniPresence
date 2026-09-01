"use client";

import React, { useState, useEffect } from "react";
import { WardrobeCategory, WardrobeItem } from "@/types/wardrobe";
import { Outfit, PopulatedOutfit } from "@/types/outfit";
import { WeatherContext } from "@/types/weather";
import { CarryItemRecommendation } from "@/types/recommendation";
import { OutfitItemSelectorModal } from "./OutfitItemSelectorModal";
import { OPAIPanel } from "@/components/ai/OPAIPanel";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { outfitService } from "@/services/outfitService";
import { weatherService } from "@/services/weatherService";
import {
  Sparkles,
  Plus,
  X,
  Save,
  CloudSun,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export interface OutfitPlannerProps {
  initialOutfit?: PopulatedOutfit | null;
  onSaved?: (outfit: Outfit) => void;
}

interface SlotConfig {
  key: string;
  label: string;
  category: WardrobeCategory;
}

const SLOTS: SlotConfig[] = [
  { key: "top", label: "Top / Shirt", category: "Tops" },
  { key: "bottom", label: "Bottom / Pants", category: "Bottoms" },
  { key: "shoes", label: "Footwear", category: "Shoes" },
  { key: "outerwear", label: "Outerwear / Jacket", category: "Outerwear" },
  { key: "accessory", label: "Accessory / Watch", category: "Accessories" },
];

const OCCASIONS = [
  "Office",
  "Meeting",
  "Casual",
  "Everyday",
  "Weekend Casual",
  "Dinner",
  "Date",
  "Formal Event",
  "Travel",
  "Workout",
];

export function OutfitPlanner({ initialOutfit, onSaved }: OutfitPlannerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(initialOutfit?.name || "");
  const [occasion, setOccasion] = useState(initialOutfit?.occasion || "Office");
  const [date, setDate] = useState(initialOutfit?.date || "");
  const [notes, setNotes] = useState(initialOutfit?.notes || "");
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>(
    initialOutfit?.items || []
  );
  const [carryItems, setCarryItems] = useState<CarryItemRecommendation[]>([]);
  const [weather, setWeather] = useState<WeatherContext | null>(null);

  // Selector Modal
  const [activeSlotCategory, setActiveSlotCategory] = useState<WardrobeCategory | "All">("All");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // OP AI Tab toggle
  const [activeTab, setActiveTab] = useState<"planner" | "op_ai">("planner");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    weatherService.getWeatherContext().then(setWeather).catch(console.warn);
  }, []);

  const handleOpenSlot = (category: WardrobeCategory) => {
    setActiveSlotCategory(category);
    setIsSelectorOpen(true);
  };

  const handleSelectItem = (item: WardrobeItem) => {
    // If an item of same category exists, replace it, else add it
    const filtered = selectedItems.filter((i) => i.id !== item.id && i.category !== item.category);
    setSelectedItems([...filtered, item]);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== itemId));
  };

  const handleRemoveCarryItem = (idx: number) => {
    setCarryItems(carryItems.filter((_, i) => i !== idx));
  };

  const handleApplyAiOutfit = (candidate: any) => {
    setSelectedItems(candidate.items);
    setName(candidate.name);
    setOccasion(candidate.occasionMatch || occasion);
    if (candidate.carryItems) {
      setCarryItems(candidate.carryItems);
    }
    setActiveTab("planner");
    success("AI Ensemble Applied", `Loaded ${candidate.items.length} pieces into your planner canvas.`);
  };

  // Weather comfort evaluation message for manual composition
  const getWeatherFeedback = () => {
    if (!weather) return null;
    const temp = weather.temperature;
    const hasOuterwear = selectedItems.some((i) => i.category === "Outerwear");

    if (temp >= 28) {
      if (hasOuterwear) {
        return `✦ OP AI: Warm ${temp}°C conditions today — ensure your outerwear is lightweight or optional.`;
      }
      return `✦ OP AI: "Looks light and comfortable for today's ${temp}°C ${weather.condition.toLowerCase()} weather."`;
    }
    if (temp <= 18) {
      if (!hasOuterwear) {
        return `✦ OP AI: Cooler ${temp}°C weather expected — consider adding an outerwear jacket or layer.`;
      }
      return `✦ OP AI: "Great layered selection for ${temp}°C cool conditions."`;
    }
    if (weather.condition === "Rainy" || weather.precipitation.toLowerCase().includes("rain")) {
      return `✦ OP AI: "Rain is in the forecast — smart to stick with weather-resistant pieces."`;
    }
    return `✦ OP AI: "Balanced look aligned with ${weather.location.split(",")[0]} conditions."`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Please provide an outfit name");
      return;
    }
    if (selectedItems.length === 0) {
      toastError("Please add at least one wardrobe piece to the outfit");
      return;
    }

    setIsSubmitting(true);
    try {
      const carryNote =
        carryItems.length > 0
          ? `\nTake: ${carryItems.map((c) => `${c.icon || "🎒"} ${c.name}`).join(", ")}`
          : "";
      const finalNotes = (notes.trim() + carryNote).trim() || undefined;

      if (initialOutfit) {
        const updated = await outfitService.updateOutfit(
          initialOutfit.id,
          {
            name: name.trim(),
            occasion,
            date: date || null,
            notes: finalNotes,
            items: selectedItems.map((i) => i.id),
          },
          user?.id
        );
        success("Outfit updated", `${updated.name} has been updated.`);
        if (onSaved) onSaved(updated);
        router.push("/outfits");
      } else {
        const created = await outfitService.createOutfit(
          {
            userId: user?.id || "user_active",
            name: name.trim(),
            occasion,
            date: date || null,
            notes: finalNotes,
            items: selectedItems.map((i) => i.id),
            wearCount: 0,
            favorite: false,
          },
          user?.id
        );
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.7 },
        });
        success("Outfit created", `"${created.name}" is saved to your planned outfits.`);
        if (onSaved) onSaved(created);
        router.push("/outfits");
      }
    } catch (err: any) {
      toastError("Failed to save outfit", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Mode Switcher & Weather Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab("planner")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "planner"
                ? "bg-[var(--surface-elevated)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Manual Composition Canvas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("op_ai")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "op_ai"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--primary)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask OP AI to Curate
          </button>
        </div>

        <div className="flex items-center gap-3">
          {weather && (
            <WeatherCard
              weather={weather}
              onWeatherChange={(w) => setWeather(w)}
              compact={true}
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => router.push("/outfits")}>
            Back to Outfits
          </Button>
        </div>
      </div>

      {activeTab === "op_ai" ? (
        <OPAIPanel
          onSelectOutfit={handleApplyAiOutfit}
          defaultOccasion={occasion}
        />
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Slot Canvas */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Outfit Composition Canvas
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Select pieces for each slot or add accessories.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  {selectedItems.length} {selectedItems.length === 1 ? "piece" : "pieces"} selected
                </span>
              </div>

              {/* Live Weather Comfort Chip */}
              {weather && (
                <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] flex items-center gap-2.5 text-xs text-[var(--text-primary)]">
                  <CloudSun className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
                  <span className="font-medium">{getWeatherFeedback()}</span>
                </div>
              )}

              {/* Slot Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SLOTS.map((slot) => {
                  const itemInSlot = selectedItems.find((i) => i.category === slot.category);
                  return (
                    <div
                      key={slot.key}
                      className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between min-h-[160px] ${
                        itemInSlot
                          ? "bg-[var(--surface-elevated)] border-[var(--primary)] shadow-sm"
                          : "bg-[var(--surface-soft)] border-dashed border-[var(--border)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          {slot.label}
                        </span>
                        {itemInSlot && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemInSlot.id)}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] cursor-pointer"
                            title="Remove piece"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {itemInSlot ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--surface-soft)] flex-shrink-0 border border-[var(--border-subtle)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={itemInSlot.imageUrl}
                              alt={itemInSlot.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {itemInSlot.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {itemInSlot.color} • {itemInSlot.brand || itemInSlot.subcategory}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenSlot(slot.category)}
                              className="text-[10px] text-[var(--primary)] font-bold mt-1.5 hover:underline cursor-pointer"
                            >
                              Swap Piece
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center my-auto py-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenSlot(slot.category)}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                          >
                            Choose {slot.category}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Carry Items (What to Take) Canvas Section */}
              {carryItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Take With You ({carryItems.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {carryItems.map((carry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs shadow-2xs"
                      >
                        <span>{carry.icon || "🎒"}</span>
                        <span className="font-bold text-[var(--text-primary)]">{carry.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCarryItem(idx)}
                          className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--error)] cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Outfit Details & Save */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-5">
              <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">
                Outfit Plan Details
              </h3>

              <Input
                label="Outfit Name *"
                placeholder="e.g. Monday Executive Briefing"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </Select>

                <Input
                  type="date"
                  label="Planned Date (Optional)"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Styling Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sharp layered look for executive presentations and sleek dinners."
                  className="w-full p-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  isLoading={isSubmitting}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {initialOutfit ? "Save Changes" : "Save Outfit Plan"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Item Picker Modal */}
      <OutfitItemSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        targetCategory={activeSlotCategory}
        selectedItemIds={selectedItems.map((i) => i.id)}
        onSelectItem={handleSelectItem}
      />
    </div>
  );
}

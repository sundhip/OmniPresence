"use client";

import React, { useState, useEffect } from "react";
import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/context/ToastContext";
import { wardrobeService } from "@/services/wardrobeService";
import {
  Heart,
  Clock,
  Sparkles,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Info,
} from "lucide-react";
import { formatDate, formatTimeAgo, getColorHex } from "@/lib/utils";

export interface ItemDetailModalProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onItemUpdated?: (updated: WardrobeItem) => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onItemUpdated,
}: ItemDetailModalProps) {
  const { success, error: toastError } = useToast();
  const [wearHistory, setWearHistory] = useState<WearEvent[]>([]);
  const [isWearing, setIsWearing] = useState(false);
  const [wearOccasion, setWearOccasion] = useState("Office");
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      if (item) {
        wardrobeService.getItemWearHistory(item.id).then(setWearHistory);
        if (item.occasion?.[0]) setWearOccasion(item.occasion[0]);
      }
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, item, onClose]);

  if (!isOpen || !item) return null;

  const handleWearToday = async () => {
    setIsWearing(true);
    try {
      const { item: updated, event } = await wardrobeService.recordWear(
        item.id,
        wearOccasion,
        `Worn on ${new Date().toLocaleDateString()}`
      );
      setWearHistory((prev) => [event, ...prev]);
      success("Logged wear today", `Wear count for ${updated.name} updated to ${updated.wearCount}.`);
      setShowOccasionPicker(false);
      if (onItemUpdated) onItemUpdated(updated);
    } catch (err: any) {
      toastError("Failed to record wear", err.message);
    } finally {
      setIsWearing(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const updated = await wardrobeService.toggleFavorite(item.id);
      success(
        updated.favorite ? "Added to favorites" : "Removed from favorites",
        updated.name
      );
      if (onItemUpdated) onItemUpdated(updated);
    } catch (err: any) {
      toastError("Failed to update favorite", err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Responsive Modal Container (Bounded max-height & width) */}
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl border transition-all animate-fade-in flex flex-col z-10"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-[var(--border-subtle)] shadow-md transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Inner: Desktop 2-column / Mobile 1-column scrollable sheet */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto md:overflow-hidden h-full">
          {/* Left Column: Image Canvas (5 cols) */}
          <div className="md:col-span-5 p-4 sm:p-6 flex flex-col items-center justify-center bg-[var(--surface-soft)] border-b md:border-b-0 md:border-r border-[var(--border-subtle)] relative">
            <div className="relative w-full aspect-[3/4] max-h-[380px] md:max-h-[500px] rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
              />

              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                className={`absolute top-3 left-3 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                  item.favorite
                    ? "bg-red-500/90 text-white shadow-md scale-105"
                    : "bg-black/50 text-white/80 hover:bg-black/80 hover:text-white"
                }`}
                aria-label="Toggle favorite"
              >
                <Heart className={`w-4 h-4 ${item.favorite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Right Column: Item Information & Wear History (7 cols, internally scrollable on desktop) */}
          <div className="md:col-span-7 flex flex-col justify-between p-5 sm:p-7 md:overflow-y-auto max-h-full">
            <div className="space-y-5">
              {/* Title & Category Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <Badge variant="primary" size="sm">
                    {item.category}
                  </Badge>
                  {item.subcategory && (
                    <Badge variant="secondary" size="sm">
                      {item.subcategory}
                    </Badge>
                  )}
                  {item.brand && (
                    <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">
                      by {item.brand}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight pr-8">
                  {item.name}
                </h2>
              </div>

              {/* Wear Statistics Banner */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Total Wears
                  </p>
                  <p className="text-base sm:text-lg font-black text-[var(--primary)] flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{item.wearCount} {item.wearCount === 1 ? "time" : "times"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Last Worn
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{formatTimeAgo(item.lastWorn)}</span>
                  </p>
                </div>
              </div>

              {/* Specifications List */}
              <div className="space-y-2 text-xs">
                {/* Primary & Secondary Color */}
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Color:</span>
                  <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: getColorHex(item.color) }}
                      />
                      {item.color}
                    </span>
                    {item.secondaryColors && item.secondaryColors.length > 0 && (
                      <span className="text-[11px] text-[var(--text-muted)] font-normal">
                        (+ {item.secondaryColors.join(", ")})
                      </span>
                    )}
                  </div>
                </div>

                {/* Size */}
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Size:</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.size || "M"}</span>
                </div>

                {/* Fit */}
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Fit Profile:</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.fit || "Regular"}</span>
                </div>

                {/* Material (Displayed only when known) */}
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Material:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {item.material || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Occasions & Seasons */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Occasions & Seasons
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {item.occasion.map((occ) => (
                    <Badge key={occ} variant="secondary" size="sm">
                      {occ}
                    </Badge>
                  ))}
                  {item.season.map((s) => (
                    <Badge key={s} variant="outline" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Styling Notes */}
              {item.notes && (
                <div className="p-3 rounded-xl bg-[var(--surface-soft)] text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  <p className="font-bold text-[var(--text-primary)] mb-0.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Care & Styling Notes:
                  </p>
                  {item.notes}
                </div>
              )}

              {/* Recent Wear Timeline */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                  <span>Recent Wear Timeline</span>
                  <span className="text-[10px] lowercase font-normal">{wearHistory.length} logs</span>
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                  {wearHistory.length > 0 ? (
                    wearHistory.slice(0, 4).map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatDate(w.date)}
                          </span>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {w.occasion}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic py-1">
                      No individual wear history logged yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="space-y-2.5 pt-5 mt-4 border-t border-[var(--border-subtle)]">
              {showOccasionPicker ? (
                <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-2.5 animate-fade-in">
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Log Occasion for Today:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Office", "Meeting", "Casual", "Dinner", "Date", "Everyday"].map((occ) => (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => setWearOccasion(occ)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          wearOccasion === occ
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-2xs"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowOccasionPicker(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleWearToday}
                      isLoading={isWearing}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    >
                      Confirm Worn Today
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => setShowOccasionPicker(true)}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Log Worn Today
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 justify-center"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Details
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onDelete(item);
                  }}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

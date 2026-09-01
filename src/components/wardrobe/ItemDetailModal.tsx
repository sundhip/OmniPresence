"use client";

import React, { useState, useEffect } from "react";
import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { Modal } from "@/components/ui/Modal";
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
  Tag,
  Layers,
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
    if (item && isOpen) {
      wardrobeService.getItemWearHistory(item.id).then(setWearHistory);
      if (item.occasion?.[0]) setWearOccasion(item.occasion[0]);
    }
  }, [item, isOpen]);

  if (!item) return null;

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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -m-2">
        {/* Left: Image Column */}
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--surface-soft)] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover object-center"
          />

          <button
            onClick={handleToggleFavorite}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 ${
              item.favorite
                ? "bg-red-500/90 text-white shadow-md scale-105"
                : "bg-black/40 text-white/80 hover:bg-black/70 hover:text-white"
            }`}
            aria-label="Toggle favorite"
          >
            <Heart className={`w-5 h-5 ${item.favorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Right: Details & Wear History Column */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header & Category */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="primary" size="sm">
                  {item.category}
                </Badge>
                {item.subcategory && (
                  <Badge variant="secondary" size="sm">
                    {item.subcategory}
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {item.name}
              </h2>
              {item.brand && (
                <p className="text-sm font-medium text-[var(--text-muted)] mt-0.5">
                  {item.brand}
                </p>
              )}
            </div>

            {/* Wear Statistics Banner */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Wears
                </p>
                <p className="text-lg font-extrabold text-[var(--primary)] flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{item.wearCount} {item.wearCount === 1 ? "time" : "times"}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Last Worn
                </p>
                <p className="text-xs font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{formatTimeAgo(item.lastWorn)}</span>
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] font-medium">Color:</span>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
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
              {item.size && (
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Size:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{item.size}</span>
                </div>
              )}
              {item.fit && (
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Fit Profile:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{item.fit}</span>
                </div>
              )}
              {item.material && (
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-medium">Material:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{item.material}</span>
                </div>
              )}
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

            {/* Notes */}
            {item.notes && (
              <div className="p-3 rounded-xl bg-[var(--surface-soft)] text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                <p className="font-semibold text-[var(--text-primary)] mb-0.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Styling Notes:
                </p>
                {item.notes}
              </div>
            )}

            {/* Wear History Timeline */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Recent Wear Timeline</span>
                <span className="text-[10px] lowercase font-normal">{wearHistory.length} logs</span>
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {wearHistory.length > 0 ? (
                  wearHistory.slice(0, 5).map((w) => (
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

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-[var(--border-subtle)]">
            {showOccasionPicker ? (
              <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-2.5 animate-fade-in">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Log Occasion for Today:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Office", "Meeting", "Casual", "Dinner", "Date", "Everyday"].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => setWearOccasion(occ)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        wearOccasion === occ
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold"
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
                className="w-full"
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
                className="flex-1"
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
    </Modal>
  );
}

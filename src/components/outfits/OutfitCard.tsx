"use client";

import React, { useState } from "react";
import { PopulatedOutfit } from "@/types/outfit";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { outfitService } from "@/services/outfitService";
import {
  Sparkles,
  Calendar,
  Clock,
  Heart,
  CheckCircle,
  Edit2,
  Trash2,
  Layers,
} from "lucide-react";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface OutfitCardProps {
  outfit: PopulatedOutfit;
  onEdit: (outfit: PopulatedOutfit) => void;
  onDelete: (outfit: PopulatedOutfit) => void;
  onRefresh: () => void;
}

export function OutfitCard({
  outfit,
  onEdit,
  onDelete,
  onRefresh,
}: OutfitCardProps) {
  const { success, error: toastError } = useToast();
  const [isWearing, setIsWearing] = useState(false);

  const handleWearOutfit = async () => {
    setIsWearing(true);
    try {
      await outfitService.wearOutfit(outfit.id);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
      success(
        "Logged entire outfit as worn",
        `Updated wear counts for all pieces in "${outfit.name}".`
      );
      onRefresh();
    } catch (err: any) {
      toastError("Failed to log outfit wear", err.message);
    } finally {
      setIsWearing(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await outfitService.updateOutfit(outfit.id, { favorite: !outfit.favorite });
      onRefresh();
    } catch (err: any) {
      toastError("Failed to update favorite", err.message);
    }
  };

  return (
    <div
      className="group flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header & Meta */}
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              {outfit.occasion}
            </Badge>
            {outfit.date && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[var(--primary)]" />
                <span>{formatDate(outfit.date)}</span>
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate">
            {outfit.name}
          </h3>
          {outfit.notes && (
            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
              {outfit.notes}
            </p>
          )}
        </div>

        <button
          onClick={handleToggleFavorite}
          className={`p-2 rounded-full border transition-all ${
            outfit.favorite
              ? "bg-red-500/10 border-red-500 text-red-500"
              : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-muted)] hover:text-red-500"
          }`}
          aria-label="Toggle favorite"
        >
          <Heart className={`w-4 h-4 ${outfit.favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Item Visual Mosaic */}
      <div className="px-5 py-2">
        <div className="grid grid-cols-4 gap-2 bg-[var(--surface-soft)] p-2.5 rounded-2xl border border-[var(--border-subtle)]">
          {outfit.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] group/item shadow-xs"
              title={`${item.name} (${item.category})`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
              />
              <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-black/60 backdrop-blur-xs text-white">
                {item.category}
              </span>
            </div>
          ))}
          {outfit.items.length < 4 &&
            Array.from({ length: 4 - outfit.items.length }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="aspect-square rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] text-[10px]"
              >
                Slot
              </div>
            ))}
        </div>
      </div>

      {/* Wear Analytics & Actions */}
      <div className="p-5 pt-3 flex flex-col justify-between flex-1 space-y-3">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{outfit.wearCount || 0} {outfit.wearCount === 1 ? "wear" : "wears"}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimeAgo(outfit.lastWorn)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleWearOutfit}
            isLoading={isWearing}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Wear Outfit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(outfit)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(outfit)}
            className="text-[var(--error)] hover:bg-red-500/10"
            title="Delete Outfit"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

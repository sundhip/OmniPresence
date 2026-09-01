"use client";

import React, { useState } from "react";
import { WardrobeItem } from "@/types/wardrobe";
import { Badge } from "@/components/ui/Badge";
import { Heart, Clock, Eye, Edit2, Trash2, CheckCircle, Sparkles } from "lucide-react";
import { formatTimeAgo, getColorHex } from "@/lib/utils";

export interface WardrobeCardProps {
  item: WardrobeItem;
  onView: (item: WardrobeItem) => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onToggleFavorite: (id: string) => void;
  onWearToday: (id: string) => void;
}

export function WardrobeCard({
  item,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  onWearToday,
}: WardrobeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="group relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Image Container */}
      <div
        className="relative w-full aspect-[4/5] bg-[var(--surface-soft)] overflow-hidden cursor-pointer"
        onClick={() => onView(item)}
      >
        {item.imageUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div
              className="w-12 h-12 rounded-2xl mb-2 flex items-center justify-center text-white font-bold text-lg shadow-inner"
              style={{ backgroundColor: getColorHex(item.color) }}
            >
              {item.category[0]}
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">{item.name}</p>
          </div>
        )}

        {/* Category & Color Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          <Badge variant="secondary" size="sm" className="bg-black/60 backdrop-blur-md text-white border-0">
            {item.category}
          </Badge>
          <span
            className="w-3.5 h-3.5 rounded-full border-2 border-white/80 shadow-sm"
            style={{ backgroundColor: getColorHex(item.color) }}
            title={`Color: ${item.color}`}
          />
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
            item.favorite
              ? "bg-red-500/90 text-white shadow-md scale-110"
              : "bg-black/40 text-white/80 hover:bg-black/70 hover:text-white"
          }`}
          aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 ${item.favorite ? "fill-current" : ""}`} />
        </button>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className="p-2.5 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform"
            title="View Details"
            aria-label="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2.5 rounded-full bg-white text-gray-900 shadow-lg hover:scale-110 transition-transform"
            title="Edit Item"
            aria-label="Edit Item"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWearToday(item.id);
            }}
            className="p-2.5 rounded-full bg-[var(--primary)] text-white shadow-lg hover:scale-110 transition-transform"
            title="Wear Today"
            aria-label="Wear Today"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="p-2.5 rounded-full bg-red-600 text-white shadow-lg hover:scale-110 transition-transform"
            title="Delete Item"
            aria-label="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Item Information Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4
              onClick={() => onView(item)}
              className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer"
            >
              {item.name}
            </h4>
          </div>
          {item.brand && (
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
              {item.brand} {item.size ? `• Size ${item.size}` : ""}
            </p>
          )}
        </div>

        {/* Wear Metrics */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{item.wearCount} {item.wearCount === 1 ? "wear" : "wears"}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`Last worn: ${item.lastWorn || "Never"}`}>
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(item.lastWorn)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

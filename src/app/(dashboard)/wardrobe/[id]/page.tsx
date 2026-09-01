"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { wardrobeService } from "@/services/wardrobeService";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/context/ToastContext";
import { WardrobeFormModal } from "@/components/wardrobe/WardrobeFormModal";
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Heart,
  Calendar,
  CheckCircle,
  Edit2,
  Trash2,
  Tag,
  Info,
} from "lucide-react";
import { formatDate, formatTimeAgo, getColorHex } from "@/lib/utils";

export default function WardrobeItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { success, error: toastError } = useToast();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [wearHistory, setWearHistory] = useState<WearEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isWearing, setIsWearing] = useState(false);

  const loadData = async () => {
    try {
      const found = await wardrobeService.getItemById(id);
      if (found) {
        setItem(found);
        const history = await wardrobeService.getItemWearHistory(id);
        setWearHistory(history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleWearToday = async () => {
    if (!item) return;
    setIsWearing(true);
    try {
      const { item: updated, event } = await wardrobeService.recordWear(
        item.id,
        item.occasion[0] || "Everyday",
        `Worn on ${new Date().toLocaleDateString()}`
      );
      setItem(updated);
      setWearHistory((prev) => [event, ...prev]);
      success("Logged wear today", `${updated.name} wear count updated to ${updated.wearCount}.`);
    } catch (err: any) {
      toastError("Failed to log wear", err.message);
    } finally {
      setIsWearing(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    try {
      const updated = await wardrobeService.toggleFavorite(item.id);
      setItem(updated);
      success(
        updated.favorite ? "Added to favorites" : "Removed from favorites",
        updated.name
      );
    } catch (err: any) {
      toastError("Failed to update favorite", err.message);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await wardrobeService.deleteItem(item.id);
      success("Item deleted", `${item.name} removed from wardrobe.`);
      router.push("/wardrobe");
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-[var(--text-muted)]">Loading piece details...</div>;
  }

  if (!item) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">Wardrobe piece not found.</p>
        <Button variant="primary" size="sm" onClick={() => router.push("/wardrobe")}>
          Return to Wardrobe
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/wardrobe")}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Wardrobe
      </Button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Image (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-[var(--surface-soft)] border border-[var(--border)] shadow-[var(--shadow-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${
                item.favorite
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-black/40 text-white/80 hover:bg-black/70"
              }`}
            >
              <Heart className={`w-5 h-5 ${item.favorite ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        {/* Right Column: Metadata & Wear Timeline (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">
                  {item.category}
                </Badge>
                {item.subcategory && (
                  <Badge variant="secondary" size="sm">
                    {item.subcategory}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {item.name}
              </h1>
              {item.brand && (
                <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">
                  {item.brand}
                </p>
              )}
            </div>

            {/* Wear Stats Banner */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Recorded Wears
                </p>
                <p className="text-xl font-black text-[var(--primary)] flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{item.wearCount} {item.wearCount === 1 ? "time" : "times"}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Last Worn
                </p>
                <p className="text-xs font-semibold text-[var(--text-primary)] mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{formatTimeAgo(item.lastWorn)}</span>
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Color</span>
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: getColorHex(item.color) }}
                  />
                  {item.color}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Size</span>
                <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{item.size || "Not specified"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Fit</span>
                <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{item.fit || "Regular"}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] font-bold uppercase">Material</span>
                <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{item.material || "100% Cotton"}</span>
              </div>
            </div>

            {/* Occasion & Seasons */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Style Context & Occasions
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

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleWearToday}
                isLoading={isWearing}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Log Worn Today
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Wear History Log Timeline */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center justify-between">
              <span>Wear History Timeline</span>
              <Badge variant="secondary" size="sm">
                {wearHistory.length} entries
              </Badge>
            </h3>

            {wearHistory.length > 0 ? (
              <div className="space-y-2.5">
                {wearHistory.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[var(--primary)]" />
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">
                          {formatDate(w.date)}
                        </p>
                        {w.notes && (
                          <p className="text-[11px] text-[var(--text-muted)]">{w.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {w.occasion}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic py-2">
                No wear events logged yet. Tap &quot;Log Worn Today&quot; to begin tracking wear history.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <WardrobeFormModal
        isOpen={isEditing}
        itemToEdit={item}
        onClose={() => setIsEditing(false)}
        onSaved={(updated) => {
          setItem(updated);
          setIsEditing(false);
        }}
      />
    </div>
  );
}

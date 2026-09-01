"use client";

import React, { useState } from "react";
import { WardrobeItem } from "@/types/wardrobe";
import { WardrobeCard } from "./WardrobeCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { WardrobeFormModal } from "./WardrobeFormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { wardrobeService } from "@/services/wardrobeService";
import { Shirt, Plus, Trash2, Sparkles } from "lucide-react";

export interface WardrobeGridProps {
  items: WardrobeItem[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export function WardrobeGrid({
  items,
  onRefresh,
  onOpenAddModal,
}: WardrobeGridProps) {
  const { success, error: toastError } = useToast();

  // Modals & Active Item states
  const [viewingItem, setViewingItem] = useState<WardrobeItem | null>(null);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WardrobeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await wardrobeService.toggleFavorite(id);
      success(
        updated.favorite ? "Added to favorites" : "Removed from favorites",
        updated.name
      );
      onRefresh();
    } catch (err: any) {
      toastError("Failed to update favorite", err.message);
    }
  };

  const handleWearToday = async (id: string) => {
    try {
      const { item: updated } = await wardrobeService.recordWear(id, "Everyday", "Worn today");
      success("Logged wear today", `Wear count for ${updated.name} updated to ${updated.wearCount}.`);
      onRefresh();
    } catch (err: any) {
      toastError("Failed to record wear", err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await wardrobeService.deleteItem(deletingItem.id);
      success("Item removed", `${deletingItem.name} has been deleted from your wardrobe.`);
      setDeletingItem(null);
      setViewingItem(null);
      onRefresh();
    } catch (err: any) {
      toastError("Failed to delete item", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Shirt className="w-8 h-8 text-[var(--primary)]" />}
        title="Your wardrobe is waiting"
        description="Add your first clothing piece to build your digital wardrobe and enable intelligent OP AI outfit recommendations."
        actionLabel="+ Add Clothing"
        onAction={onOpenAddModal}
      />
    );
  }

  return (
    <>
      {/* Wardrobe Grid (2 cols mobile, 3 cols tablet, 4-5 cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-fade-in">
        {items.map((item) => (
          <WardrobeCard
            key={item.id}
            item={item}
            onView={(i) => setViewingItem(i)}
            onEdit={(i) => setEditingItem(i)}
            onDelete={(i) => setDeletingItem(i)}
            onToggleFavorite={handleToggleFavorite}
            onWearToday={handleWearToday}
          />
        ))}
      </div>

      {/* Item Detail Modal */}
      {viewingItem && (
        <ItemDetailModal
          item={viewingItem}
          isOpen={Boolean(viewingItem)}
          onClose={() => setViewingItem(null)}
          onEdit={(i) => {
            setViewingItem(null);
            setEditingItem(i);
          }}
          onDelete={(i) => {
            setViewingItem(null);
            setDeletingItem(i);
          }}
          onItemUpdated={(updated) => {
            setViewingItem(updated);
            onRefresh();
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <WardrobeFormModal
          isOpen={Boolean(editingItem)}
          itemToEdit={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Delete Wardrobe Item?"
        description="This will permanently remove this piece from your digital wardrobe and future outfit recommendations."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          {deletingItem && (
            <div className="p-3 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deletingItem.imageUrl}
                  alt={deletingItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate text-[var(--text-primary)]">
                  {deletingItem.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {deletingItem.category} • {deletingItem.wearCount} wears
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeletingItem(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={confirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Item
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

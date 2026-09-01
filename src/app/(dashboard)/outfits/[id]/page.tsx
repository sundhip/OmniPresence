"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PopulatedOutfit } from "@/types/outfit";
import { outfitService } from "@/services/outfitService";
import { OutfitPlanner } from "@/components/outfits/OutfitPlanner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function EditOutfitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outfit, setOutfit] = useState<PopulatedOutfit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      outfitService
        .getPopulatedOutfit(id)
        .then((data) => {
          setOutfit(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-[var(--text-muted)]">Loading outfit details...</div>;
  }

  if (!outfit) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">Outfit plan not found.</p>
        <Button variant="primary" size="sm" onClick={() => router.push("/outfits")}>
          Return to Outfits
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/outfits")}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Outfits
        </Button>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Edit Outfit: {outfit.name}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Modify components, occasions, planned date, or notes.
        </p>
      </div>

      <OutfitPlanner initialOutfit={outfit} />
    </div>
  );
}

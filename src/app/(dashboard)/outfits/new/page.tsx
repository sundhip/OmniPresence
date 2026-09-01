"use client";

import React from "react";
import { OutfitPlanner } from "@/components/outfits/OutfitPlanner";

export default function NewOutfitPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
          Plan & Curate Outfit
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Compose pieces manually on the canvas or ask OP AI for an intelligent personalized recommendation.
        </p>
      </div>

      <OutfitPlanner />
    </div>
  );
}

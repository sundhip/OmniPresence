"use client";

import React from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Sparkles } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            User Profile & Style Intelligence
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            OP AI Calibrated
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Customize your styling preferences, sizing parameters, color affinities, and lifestyle profile.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}

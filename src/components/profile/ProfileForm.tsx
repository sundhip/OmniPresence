"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, StylePreference, ColorPreference, OccasionType, FitPreference } from "@/types/user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/context/ToastContext";
import { profileService } from "@/services/profileService";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Save, Check, User, Shield, Bell, Palette, Tag } from "lucide-react";
import { getColorHex } from "@/lib/utils";

const STYLE_OPTIONS: StylePreference[] = [
  "Casual",
  "Smart Casual",
  "Formal",
  "Minimal",
  "Streetwear",
  "Sporty",
  "Traditional",
  "Vintage",
  "Business Casual",
];

const COLOR_OPTIONS: ColorPreference[] = [
  "Black",
  "White",
  "Navy",
  "Grey",
  "Beige",
  "Earth Tones",
  "Pastel",
  "Bright",
  "Monochrome",
  "Olive",
  "Burgundy",
];

const OCCASION_OPTIONS: OccasionType[] = [
  "Office",
  "Meeting",
  "Everyday",
  "Weekend Casual",
  "Dinner",
  "Date",
  "Formal Event",
  "Travel",
  "College",
  "Workout",
];

const FIT_OPTIONS: FitPreference[] = ["Slim", "Tailored", "Regular", "Relaxed", "Oversized"];

export function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [styles, setStyles] = useState<StylePreference[]>([]);
  const [colors, setColors] = useState<ColorPreference[]>([]);
  const [occasions, setOccasions] = useState<OccasionType[]>([]);
  const [fits, setFits] = useState<FitPreference[]>([]);
  const [topsSize, setTopsSize] = useState("");
  const [bottomsSize, setBottomsSize] = useState("");
  const [shoesSize, setShoesSize] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [brands, setBrands] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
      setBio(user.bio || "");
      setStyles(user.stylePreferences || []);
      setColors(user.colorPreferences || []);
      setOccasions(user.occasionPreferences || []);
      setFits(user.fitPreferences || []);
      setTopsSize(user.sizes?.tops || "M");
      setBottomsSize(user.sizes?.bottoms || "32");
      setShoesSize(user.sizes?.shoes || "10.5 US");
      setBrands(user.preferredBrands || []);
    }
  }, [user]);

  const toggleStyle = (s: StylePreference) => {
    setStyles((prev) => (prev.includes(s) ? prev.filter((i) => i !== s) : [...prev, s]));
  };

  const toggleColor = (c: ColorPreference) => {
    setColors((prev) => (prev.includes(c) ? prev.filter((i) => i !== c) : [...prev, c]));
  };

  const toggleOccasion = (o: OccasionType) => {
    setOccasions((prev) => (prev.includes(o) ? prev.filter((i) => i !== o) : [...prev, o]));
  };

  const toggleFit = (f: FitPreference) => {
    setFits((prev) => (prev.includes(f) ? prev.filter((i) => i !== f) : [...prev, f]));
  };

  const handleAddBrand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && brandInput.trim()) {
      e.preventDefault();
      if (!brands.includes(brandInput.trim())) {
        setBrands([...brands, brandInput.trim()]);
      }
      setBrandInput("");
    }
  };

  const removeBrand = (brandToRemove: string) => {
    setBrands(brands.filter((b) => b !== brandToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await profileService.updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        stylePreferences: styles,
        colorPreferences: colors,
        occasionPreferences: occasions,
        fitPreferences: fits,
        sizes: {
          tops: topsSize,
          bottoms: bottomsSize,
          shoes: shoesSize,
        },
        preferredBrands: brands,
      });
      await refreshUser();
      success("Profile & Preferences Saved", "Your style intelligence profile has been updated.");
    } catch (err: any) {
      toastError("Failed to save profile", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl animate-fade-in">
      {/* Basic Profile Info */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--primary)]" />
          Personal Identity
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar src={avatar} name={name} size="xl" />
          <div className="flex-1 w-full space-y-3">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
            <Input
              label="Avatar Image URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Personal Bio & Philosophy
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell OP AI about your lifestyle and styling priorities..."
            className="w-full p-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all resize-none"
          />
        </div>
      </div>

      {/* Style & Fit Preferences */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          Style & Aesthetic Preferences
        </h3>

        {/* Style Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
            Preferred Aesthetics
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => {
              const isSelected = styles.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  {s}
                  {isSelected && " ✓"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
            Favorite Color Palette
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => {
              const isSelected = colors.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleColor(c)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: getColorHex(c) }}
                  />
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Occasions */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
            Primary Occasions
          </label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((o) => {
              const isSelected = occasions.includes(o);
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggleOccasion(o)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fit Preferences */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
            Silhouette & Fit Profiles
          </label>
          <div className="flex flex-wrap gap-2">
            {FIT_OPTIONS.map((f) => {
              const isSelected = fits.includes(f);
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleFit(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--surface-elevated)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sizing & Brands */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[var(--primary)]" />
          Sizing & Brand Affinities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tops Size"
            value={topsSize}
            onChange={(e) => setTopsSize(e.target.value)}
            placeholder="e.g. M / 40"
          />
          <Input
            label="Bottoms Size"
            value={bottomsSize}
            onChange={(e) => setBottomsSize(e.target.value)}
            placeholder="e.g. 32 / 30"
          />
          <Input
            label="Footwear Size"
            value={shoesSize}
            onChange={(e) => setShoesSize(e.target.value)}
            placeholder="e.g. 10.5 US"
          />
        </div>

        {/* Brand Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Preferred Brands (Type and press Enter)
          </label>
          <Input
            value={brandInput}
            onChange={(e) => setBrandInput(e.target.value)}
            onKeyDown={handleAddBrand}
            placeholder="e.g. Theory, Acne Studios, Cos (Press Enter)"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {brands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {b}
                <button
                  type="button"
                  onClick={() => removeBrand(b)}
                  className="text-[var(--text-muted)] hover:text-[var(--error)] ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save All Profile Preferences
        </Button>
      </div>
    </form>
  );
}

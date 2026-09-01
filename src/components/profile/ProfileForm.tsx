"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserProfile,
  StylePreference,
  ColorPreference,
  OccasionType,
  FitPreference,
  SKIN_TONE_PALETTE,
  SkinTonePaletteItem,
  OutfitPriority,
  ShoppingPriority,
  ReminderTopic,
  ReminderProactivity,
  GenderPreference,
} from "@/types/user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { CameraCaptureModal } from "@/components/ui/CameraCaptureModal";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Save,
  User,
  Tag,
  Palette,
  Camera,
  Upload,
  ShoppingBag,
  Bell,
  Heart,
  Layers,
  Edit2,
  Check,
  Image as ImageIcon,
} from "lucide-react";
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
  "Trendy",
  "Elegant",
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
  "Red",
  "Blue",
  "Brown",
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
  "Weddings / Functions",
  "Festivals",
];

const FIT_OPTIONS: FitPreference[] = ["Slim", "Tailored", "Regular", "Relaxed", "Oversized"];

// Utility to downsample avatars for fast storage and crisp display
function compressAvatarImage(base64DataUrl: string, maxDimension: number = 400): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !base64DataUrl.startsWith("data:image")) {
      resolve(base64DataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } else {
        resolve(base64DataUrl);
      }
    };
    img.onerror = () => resolve(base64DataUrl);
    img.src = base64DataUrl;
  });
}

export function ProfileForm() {
  const { user, updateUser, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [gender, setGender] = useState<GenderPreference>("Women");
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

  // Appearance & Smart Personalization States
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinTonePaletteItem>(
    SKIN_TONE_PALETTE[4]
  );
  const [hairColor, setHairColor] = useState(user?.appearance?.hair?.color || "Dark Brown");
  const [hairTexture, setHairTexture] = useState(user?.appearance?.hair?.texture || "Wavy");
  const [hairLength, setHairLength] = useState(user?.appearance?.hair?.length || "Medium");
  const [faceShape, setFaceShape] = useState(user?.appearance?.faceShape?.shape || "Oval");

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
      setGender(user.gender || "Women");
      setBio(user.bio || "");
      setStyles(user.stylePreferences || []);
      setColors(user.colorPreferences || []);
      setOccasions(user.occasionPreferences || []);
      setFits(user.fitPreferences || []);
      setTopsSize(user.sizes?.tops || "M");
      setBottomsSize(user.sizes?.bottoms || "32");
      setShoesSize(user.sizes?.shoes || "10.5 US");
      setBrands(user.preferredBrands || []);

      if (user.appearance?.skinTone?.paletteId) {
        const found = SKIN_TONE_PALETTE.find((p) => p.id === user.appearance?.skinTone?.paletteId);
        if (found) setSelectedSkinTone(found);
      }
      if (user.appearance?.hair) {
        setHairColor(user.appearance.hair.color);
        setHairTexture(user.appearance.hair.texture);
        setHairLength(user.appearance.hair.length);
      }
      if (user.appearance?.faceShape) {
        setFaceShape(user.appearance.faceShape.shape);
      }
    }
  }, [user]);

  // Handle local image file upload for avatar
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toastError("Photo size must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        const compressed = await compressAvatarImage(rawBase64, 400);
        setAvatar(compressed);
        try {
          await updateUser({ avatar: compressed });
          success("Profile DP Updated", "Your profile photo is updated across OmniPresence.");
        } catch (err: any) {
          console.warn("Avatar auto-save note:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture for avatar
  const handleCameraCapture = async (img: string) => {
    const compressed = await compressAvatarImage(img, 400);
    setAvatar(compressed);
    try {
      await updateUser({ avatar: compressed });
      success("Profile DP Updated", "Camera snapshot saved as profile photo.");
    } catch (err: any) {
      console.warn("Avatar camera save note:", err);
    }
  };

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
      await updateUser({
        name: name.trim(),
        avatar: avatar.trim(),
        gender,
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
        appearance: {
          skinTone: {
            paletteId: selectedSkinTone.id,
            hex: selectedSkinTone.hex,
            name: selectedSkinTone.name,
            undertone: selectedSkinTone.undertone,
            source: "User",
          },
          hair: {
            color: hairColor as any,
            texture: hairTexture as any,
            length: hairLength as any,
            currentStyle: user?.appearance?.hair?.currentStyle || "Short Crop",
            source: "User",
          },
          faceShape: {
            shape: faceShape as any,
            source: "User",
          },
          isAiAnalyzed: user?.appearance?.isAiAnalyzed,
          photoUrl: avatar || user?.appearance?.photoUrl,
        },
      });
      await refreshUser();
      success("Profile & Appearance Saved", "Your style profile and appearance attributes have been saved.");
    } catch (err: any) {
      toastError("Failed to save profile", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl animate-fade-in">
      {/* Hidden file input for DP */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFile}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Live Camera Modal for DP */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Take Profile Photo (DP)"
        guideType="face"
      />

      {/* 1. Basic Profile Info & DP Photo Controls */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-[var(--primary)]" />
          Personal Identity & Profile Photo (DP)
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Interactive DP with Quick Edit Overlays */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarFileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <Avatar
                src={avatar}
                name={name}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-[var(--surface-elevated)] shadow-lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-1">Change DP</span>
              </div>
            </div>

            {/* Direct Camera and Upload Actions for DP */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="py-2 px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs min-h-[38px] whitespace-nowrap cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[var(--primary)]" />
                Take Photo
              </button>

              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="py-2 px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs min-h-[38px] whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--primary)]" />
                Upload Photo
              </button>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
            <Input
              label="Avatar Image URL (Optional)"
              value={avatar.startsWith("data:image") ? "Uploaded Photo (Local Image)" : avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />

            {/* Gender / Fashion Focus Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Fashion Category & Gender Focus
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Women", label: "Women's Fashion" },
                  { id: "Men", label: "Men's Fashion" },
                  { id: "All", label: "All / Unisex" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all min-h-[42px] cursor-pointer ${
                      gender === g.id
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] ring-2 ring-[var(--primary)]"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Personal Bio & Style Philosophy
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell OP AI about your styling priorities, daily routine, and aesthetic..."
            className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all resize-none"
          />
        </div>
      </div>

      {/* 2. Appearance & Color Harmony */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--primary)]" />
            Appearance & Colour Harmony
          </h3>
          <span className="text-xs px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold">
            {user?.appearance?.isAiAnalyzed ? "✦ Photo Calibrated" : "Custom Calibrated"}
          </span>
        </div>

        {/* Skin Tone Palette Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Skin Tone Palette ({selectedSkinTone.name} • {selectedSkinTone.undertone} undertone)
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {SKIN_TONE_PALETTE.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => setSelectedSkinTone(tone)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer min-h-[64px] ${
                  selectedSkinTone.id === tone.id
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
                    : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary)]"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full border shadow-xs"
                  style={{ backgroundColor: tone.hex }}
                />
                <span className="text-[9px] font-bold text-[var(--text-primary)] text-center line-clamp-1">
                  {tone.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hair & Face Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Hair Colour
            </label>
            <input
              type="text"
              value={hairColor}
              onChange={(e) => setHairColor(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Hair Texture
            </label>
            <input
              type="text"
              value={hairTexture}
              onChange={(e) => setHairTexture(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Face Shape
            </label>
            <input
              type="text"
              value={faceShape}
              onChange={(e) => setFaceShape(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* 3. Style & Fit Preferences */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          Style & Aesthetic Preferences
        </h3>

        {/* Style Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Preferred Aesthetics
          </label>
          <div className="flex flex-wrap gap-2.5">
            {STYLE_OPTIONS.map((s) => {
              const isSelected = styles.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <span>{s}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Favorite Color Palette
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map((c) => {
              const isSelected = colors.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleColor(c)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer min-h-[40px] ${
                    isSelected
                      ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                      : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Primary Occasions
          </label>
          <div className="flex flex-wrap gap-2.5">
            {OCCASION_OPTIONS.map((o) => {
              const isSelected = occasions.includes(o);
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => toggleOccasion(o)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer min-h-[40px] ${
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Silhouette & Fit Profiles
          </label>
          <div className="flex flex-wrap gap-2.5">
            {FIT_OPTIONS.map((f) => {
              const isSelected = fits.includes(f);
              return (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleFit(f)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer min-h-[40px] ${
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

      {/* 4. Sizing & Brands */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 flex items-center gap-2">
          <Tag className="w-5 h-5 text-[var(--primary)]" />
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] min-h-[32px]"
              >
                {b}
                <button
                  type="button"
                  onClick={() => removeBrand(b)}
                  className="text-[var(--text-muted)] hover:text-[var(--error)] ml-1 text-sm font-bold cursor-pointer"
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
          className="py-3 px-8 text-xs sm:text-sm font-bold min-h-[48px] shadow-lg"
        >
          Save All Profile Preferences
        </Button>
      </div>
    </form>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  StylePreference,
  ColorPreference,
  OccasionType,
  FitPreference,
  SKIN_TONE_PALETTE,
  SkinTonePaletteItem,
  SkinToneInfo,
  HairColour,
  HairTexture,
  HairLength,
  CurrentHairstyle,
  FaceShape,
  HairProfile,
  FaceShapeInfo,
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
import { appearanceAnalysisService } from "@/services/appearanceAnalysisService";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  Upload,
  SkipForward,
  Check,
  Edit2,
  Info,
  ShoppingBag,
  Bell,
  Heart,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
  User,
  Ruler,
  Palette,
} from "lucide-react";
import { getColorHex } from "@/lib/utils";
import confetti from "canvas-confetti";

// Option Lists
const HAIR_COLOURS: HairColour[] = [
  "Black",
  "Dark Brown",
  "Brown",
  "Light Brown",
  "Blonde",
  "Auburn / Red",
  "Grey / White",
  "Dyed / Multiple Colours",
  "Other",
];

const HAIR_TEXTURES: HairTexture[] = [
  "Straight",
  "Wavy",
  "Curly",
  "Coily",
  "Very Curly / Tight Curls",
  "Not Sure",
];

const HAIR_LENGTHS: HairLength[] = [
  "Very Short",
  "Short",
  "Medium",
  "Shoulder Length",
  "Long",
  "Very Long",
  "Not Sure",
];

const CURRENT_HAIRSTYLES: CurrentHairstyle[] = [
  "Short Crop",
  "Bob",
  "Layered",
  "Long & Open",
  "Ponytail",
  "Bun",
  "Braids",
  "Fade / Taper",
  "Undercut",
  "Curly / Natural",
  "Other",
  "I change hairstyles often",
];

const FACE_SHAPES: FaceShape[] = [
  "Oval",
  "Round",
  "Square",
  "Heart",
  "Diamond",
  "Oblong / Long",
  "Not Sure",
];

const DESIRED_HAIRSTYLE_OPTIONS = [
  "Decent / Neat",
  "Professional",
  "Casual",
  "Modern / Trendy",
  "Traditional",
  "Low Maintenance",
  "Bold / Experimental",
  "Natural",
  "Long Hair",
  "Short Hair",
  "Let OP AI Suggest",
];

const FASHION_STYLES: StylePreference[] = [
  "Casual",
  "Smart Casual",
  "Formal",
  "Streetwear",
  "Traditional",
  "Minimal",
  "Trendy",
  "Sporty",
  "Elegant",
  "Experimental",
  "Let OP AI Learn",
];

const COLOR_CHOICES: ColorPreference[] = [
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
  "Brown",
];

const OCCASIONS: OccasionType[] = [
  "College",
  "Office",
  "Business / Meetings",
  "Casual Outings",
  "Date",
  "Party",
  "Weddings / Functions",
  "Festivals",
  "Travel",
  "Gym / Sports",
  "Everyday Wear",
  "Other",
];

const OUTFIT_PRIORITIES: OutfitPriority[] = [
  "Comfort",
  "Appearance",
  "Colours that suit me",
  "Latest Trends",
  "Budget",
  "Quality",
  "Brand",
  "Durability",
  "Easy Maintenance",
  "Professional Appearance",
  "Traditional Appearance",
  "Unique / Stand-out Style",
];

const SHOPPING_PRIORITIES: ShoppingPriority[] = [
  "Lowest Price",
  "Best Value for Money",
  "Best Quality",
  "Highest Rated",
  "Most Popular",
  "Most Sold",
  "Fastest Delivery",
  "Trusted Brand",
  "Trending",
  "Discounts / Offers",
];

const REMINDER_TOPICS: ReminderTopic[] = [
  "Outfit Planning",
  "Event Preparation",
  "Grooming / Hairstyle",
  "Wardrobe Maintenance",
  "Laundry",
  "Shopping / Budget",
  "Upcoming Events",
  "Travel",
  "Weather-Based Reminders",
  "No Reminders",
];

const PROACTIVITY_LEVELS: ReminderProactivity[] = [
  "Important Reminders Only",
  "Helpful Suggestions",
  "Proactive Suggestions",
  "Let OP AI Decide",
];

const TOPS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const BOTTOMS_SIZES = ["28", "30", "32", "34", "36", "38", "40", "Custom"];
const FIT_OPTIONS: FitPreference[] = ["Slim", "Regular", "Relaxed", "Oversized", "Tailored"];

// Downsample avatar for localStorage safe storage
function compressAvatar(base64: string, maxDim: number = 400): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !base64.startsWith("data:image")) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
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
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dpInputRef = useRef<HTMLInputElement>(null);

  // Workflow Stages (1 to 8)
  // 1: Photo Prompt (Take Photo / Upload / Skip)
  // 2: Appearance (2A Review or 2B Manual Selection)
  // 3: Identity & Bio (Name, Bio, DP)
  // 4: Sizing & Fit Silhouette (Tops, Bottoms, Footwear, Fit)
  // 5: Desired Hairstyle / Look Preference
  // 6: Everyday Fashion Style & Color Palette
  // 7: Common Occasions & Outfit Priorities
  // 8: Shopping Priorities & OP AI Reminders
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // Photo & Vision Analysis State
  const [hasUploadedPhoto, setHasUploadedPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"appearance" | "dp">("appearance");

  // Appearance State
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinTonePaletteItem>(
    SKIN_TONE_PALETTE[4]
  );
  const [hairColor, setHairColor] = useState<HairColour>("Dark Brown");
  const [hairTexture, setHairTexture] = useState<HairTexture>("Wavy");
  const [hairLength, setHairLength] = useState<HairLength>("Medium");
  const [currentStyle, setCurrentStyle] = useState<CurrentHairstyle>("Short Crop");
  const [faceShape, setFaceShape] = useState<FaceShape>("Oval");
  const [appearanceSource, setAppearanceSource] = useState<
    "AI" | "User" | "AI_Confirmed" | "Manual"
  >("Manual");
  const [editingField, setEditingField] = useState<string | null>(null);

  // Identity, Gender & Bio State (No more static default assumptions!)
  const [displayName, setDisplayName] = useState(user?.name && user.name !== "Hero" ? user.name : "");
  const [gender, setGender] = useState<GenderPreference>(user?.gender || "Women");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  // Sizing & Fit State
  const [topsSize, setTopsSize] = useState(user?.sizes?.tops || "M");
  const [bottomsSize, setBottomsSize] = useState(user?.sizes?.bottoms || "32");
  const [shoesSize, setShoesSize] = useState(user?.sizes?.shoes || "10.5 US");
  const [fitPreference, setFitPreference] = useState<FitPreference>("Regular");

  // Preference State
  const [desiredHairstyles, setDesiredHairstyles] = useState<string[]>([
    "Decent / Neat",
  ]);
  const [selectedStyles, setSelectedStyles] = useState<StylePreference[]>([
    "Smart Casual",
    "Minimal",
  ]);
  const [selectedColors, setSelectedColors] = useState<ColorPreference[]>([
    "Black",
    "White",
    "Navy",
  ]);
  const [selectedOccasions, setSelectedOccasions] = useState<OccasionType[]>([
    "Office",
    "Casual Outings",
  ]);
  const [outfitPriorities, setOutfitPriorities] = useState<OutfitPriority[]>([
    "Comfort",
    "Quality",
    "Colours that suit me",
  ]);
  const [shoppingPriorities, setShoppingPriorities] = useState<ShoppingPriority[]>([
    "Best Value for Money",
    "Best Quality",
    "Highest Rated",
  ]);
  const [reminderTopics, setReminderTopics] = useState<ReminderTopic[]>([
    "Outfit Planning",
    "Weather-Based Reminders",
    "Upcoming Events",
  ]);
  const [proactivity, setProactivity] = useState<ReminderProactivity>(
    "Helpful Suggestions"
  );

  const [isFinishing, setIsFinishing] = useState(false);

  // -------------------------------------------------------------
  // 1. PHOTO ANALYSIS FOR APPEARANCE
  // -------------------------------------------------------------
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toastError("Photo size must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressAvatar(base64, 480);
        processAppearancePhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAppearancePhoto = async (imgDataUrl: string) => {
    setPhotoPreview(imgDataUrl);
    setHasUploadedPhoto(true);
    setIsAnalyzingPhoto(true);

    // Also auto-set as avatar if no avatar yet
    if (!avatar) setAvatar(imgDataUrl);

    try {
      const result = await appearanceAnalysisService.analyzePhoto(imgDataUrl);

      const matchedPalette =
        SKIN_TONE_PALETTE.find((p) => p.id === result.skinTone.paletteId) ||
        SKIN_TONE_PALETTE[4];

      setSelectedSkinTone(matchedPalette);
      setHairColor(result.hair.color);
      setHairTexture(result.hair.texture);
      setHairLength(result.hair.length);
      setCurrentStyle(result.hair.currentStyle);
      setFaceShape(result.faceShape.shape);
      setAppearanceSource("AI");

      success("✦ OP AI Appearance Analysis", result.aiSummary);
      setCurrentStep(2);
    } catch (err: any) {
      console.warn("Appearance analysis fallback:", err);
      toastError("Could not analyze photo clearly. You can choose details manually.");
      setHasUploadedPhoto(false);
      setCurrentStep(2);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSkipPhoto = () => {
    setHasUploadedPhoto(false);
    setAppearanceSource("Manual");
    setCurrentStep(2);
  };

  // -------------------------------------------------------------
  // 2. DP UPLOAD / CAMERA HANDLERS FOR IDENTITY STEP
  // -------------------------------------------------------------
  const handleDpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressAvatar(base64, 400);
        setAvatar(compressed);
        success("Profile Picture Set", "New DP photo loaded.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async (img: string) => {
    const compressed = await compressAvatar(img, 480);
    if (cameraMode === "appearance") {
      processAppearancePhoto(compressed);
    } else {
      setAvatar(compressed);
      success("Profile Picture Set", "Live camera snapshot set as DP.");
    }
  };

  // -------------------------------------------------------------
  // 3. TOGGLE HELPERS
  // -------------------------------------------------------------
  const toggleDesiredHairstyle = (item: string) => {
    setDesiredHairstyles((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleStyle = (style: StylePreference) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleColor = (c: ColorPreference) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((i) => i !== c) : [...prev, c]
    );
  };

  const toggleOccasion = (occ: OccasionType) => {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const toggleOutfitPriority = (p: OutfitPriority) => {
    setOutfitPriorities((prev) =>
      prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]
    );
  };

  const toggleShoppingPriority = (p: ShoppingPriority) => {
    setShoppingPriorities((prev) =>
      prev.includes(p) ? prev.filter((i) => i !== p) : [...prev, p]
    );
  };

  const toggleReminderTopic = (topic: ReminderTopic) => {
    if (topic === "No Reminders") {
      setReminderTopics(["No Reminders"]);
      return;
    }
    setReminderTopics((prev) => {
      const clean = prev.filter((t) => t !== "No Reminders");
      return clean.includes(topic)
        ? clean.filter((t) => t !== topic)
        : [...clean, topic];
    });
  };

  // -------------------------------------------------------------
  // 4. FINAL ONBOARDING PROFILE SUBMISSION
  // -------------------------------------------------------------
  const handleFinishOnboarding = async () => {
    setIsFinishing(true);
    try {
      const finalName = displayName.trim() || user?.name || "Member";

      const skinToneData: SkinToneInfo = {
        paletteId: selectedSkinTone.id,
        hex: selectedSkinTone.hex,
        name: selectedSkinTone.name,
        undertone: selectedSkinTone.undertone,
        source: appearanceSource === "AI" ? "AI_Confirmed" : "User",
      };

      const hairData: HairProfile = {
        color: hairColor,
        texture: hairTexture,
        length: hairLength,
        currentStyle: currentStyle,
        source: appearanceSource === "AI" ? "AI_Confirmed" : "User",
      };

      const faceShapeData: FaceShapeInfo = {
        shape: faceShape,
        source: appearanceSource === "AI" ? "AI_Confirmed" : "User",
      };

      await updateUser({
        name: finalName,
        gender,
        bio: bio.trim(),
        avatar: avatar || undefined,
        stylePreferences: selectedStyles,
        colorPreferences: selectedColors,
        occasionPreferences: selectedOccasions,
        fitPreference,
        fitPreferences: [fitPreference],
        sizes: {
          tops: topsSize,
          bottoms: bottomsSize,
          shoes: shoesSize,
        },
        desiredHairstyles,
        outfitPriorities,
        shoppingPreferences: {
          priorities: shoppingPriorities,
        },
        reminderPreferences: {
          topics: reminderTopics,
          proactivity,
        },
        appearance: {
          skinTone: skinToneData,
          hair: hairData,
          faceShape: faceShapeData,
          photoUrl: photoPreview || avatar || undefined,
          isAiAnalyzed: hasUploadedPhoto,
          analyzedAt: new Date().toISOString(),
        },
        onboarded: true,
      });

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });

      success(
        "✦ Personal Intelligence Ready",
        `Welcome ${finalName}. Your profile, style preferences, and appearance parameters are calibrated.`
      );
      router.push("/home");
    } catch (err: any) {
      toastError(err.message || "Failed to save profile");
    } finally {
      setIsFinishing(false);
    }
  };

  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const showNeatLongHairAdvisory =
    desiredHairstyles.includes("Decent / Neat") &&
    (desiredHairstyles.includes("Long Hair") || hairLength === "Long");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--background)]">
      <div
        className="w-full max-w-2xl p-6 sm:p-10 rounded-3xl border shadow-2xl space-y-8 animate-fade-in relative overflow-hidden"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Progress Bar Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              OP AI Personalization Calibration
            </span>
            <span>
              Step {currentStep} of {totalSteps} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoUpload}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        <input
          type="file"
          ref={dpInputRef}
          onChange={handleDpUpload}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {/* Camera Modal Component */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title={
            cameraMode === "appearance"
              ? "Take Portrait for Appearance Analysis"
              : "Take Profile Photo (DP)"
          }
          guideType="face"
        />

        {/* ========================================================================= */}
        {/* STEP 1: OPTIONAL PHOTO UPLOAD / CAPTURE                                   */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center mx-auto text-[var(--primary)] shadow-sm">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Would you like OP AI to personalize using a photo?
              </h1>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                OP AI can estimate your skin tone palette, hair texture/length, and face
                shape from a single photo. Photo upload is completely optional.
              </p>
            </div>

            {/* Scanning Feedback State */}
            {isAnalyzingPhoto ? (
              <div className="p-8 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)]/30 space-y-4 animate-pulse">
                <div className="flex items-center justify-center gap-2 text-[var(--primary)] font-bold">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>OP AI is analyzing your photo...</span>
                </div>
                <div className="text-xs text-[var(--text-muted)] space-y-1">
                  <p>✓ Isolating facial structure & skin pixels</p>
                  <p>✓ Mapping to calibrated skin tone palette</p>
                  <p>✓ Evaluating hair texture and face landmarks</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface-elevated)] text-left flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-sm group min-h-[140px] cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-[var(--text-primary)] text-base">
                    Upload Photo
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] text-center">
                    Select a portrait or selfie from your device
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCameraMode("appearance");
                    setIsCameraOpen(true);
                  }}
                  className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface-elevated)] text-left flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-sm group min-h-[140px] cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-[var(--text-primary)] text-base">
                    Take Photo
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] text-center">
                    Open your camera and capture a selfie
                  </span>
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSkipPhoto}
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-2.5 px-4 rounded-xl hover:bg-[var(--surface-elevated)] min-h-[44px] cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                Skip for now (I will choose my appearance manually)
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2A: UNIFIED APPEARANCE REVIEW SCREEN (IF PHOTO UPLOADED)            */}
        {/* ========================================================================= */}
        {currentStep === 2 && hasUploadedPhoto && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold border border-[var(--primary)]/20">
                  ✦ OP AI Vision Estimates
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                OP AI analyzed your photo
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Here are the detected appearance attributes. You can confirm all or edit any detail.
              </p>
            </div>

            {/* 6 Unified Review Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Skin Tone Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: selectedSkinTone.hex }}
                  />
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                      Skin Tone
                    </span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {selectedSkinTone.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] block">
                      {selectedSkinTone.undertone} undertone
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("skinTone")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* 2. Hair Colour Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                    Hair Colour
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {hairColor}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    AI suggested
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("hairColor")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* 3. Hair Texture Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                    Hair Texture
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {hairTexture}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    AI estimated
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("hairTexture")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* 4. Hair Length Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                    Hair Length
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {hairLength}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    AI estimated
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("hairLength")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* 5. Current Hairstyle Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                    Current Hairstyle
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {currentStyle}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    AI identified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("currentStyle")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {/* 6. Face Shape Card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between shadow-sm min-h-[76px]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                    Face Shape
                  </span>
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    {faceShape}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] block">
                    AI estimated
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField("faceShape")}
                  className="py-2 px-3 rounded-xl text-[var(--primary)] hover:bg-[var(--primary-soft)] text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>

            {/* Inline Selectors for Editing Review Attributes */}
            {editingField === "skinTone" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Select Your Skin Tone Palette:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-xs text-[var(--primary)] font-bold py-1 px-2.5 rounded-lg hover:bg-[var(--primary-soft)] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SKIN_TONE_PALETTE.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        setSelectedSkinTone(tone);
                        setAppearanceSource("User");
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[64px] cursor-pointer ${
                        selectedSkinTone.id === tone.id
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border shadow-sm"
                        style={{ backgroundColor: tone.hex }}
                      />
                      <span className="text-[10px] font-bold text-[var(--text-primary)] text-center line-clamp-1">
                        {tone.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingField === "hairColor" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Choose Hair Colour:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setHairColor(c);
                        setAppearanceSource("User");
                        setEditingField(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        hairColor === c
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingField === "hairTexture" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Choose Hair Texture:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HAIR_TEXTURES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setHairTexture(t);
                        setAppearanceSource("User");
                        setEditingField(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        hairTexture === t
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingField === "hairLength" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Choose Hair Length:
                </span>
                <div className="flex flex-wrap gap-2">
                  {HAIR_LENGTHS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setHairLength(l);
                        setAppearanceSource("User");
                        setEditingField(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        hairLength === l
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingField === "currentStyle" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Choose Current Hairstyle:
                </span>
                <div className="flex flex-wrap gap-2">
                  {CURRENT_HAIRSTYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setCurrentStyle(s);
                        setAppearanceSource("User");
                        setEditingField(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        currentStyle === s
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingField === "faceShape" && (
              <div className="p-5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--primary)] space-y-3 animate-fade-in shadow-md">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Choose Face Shape:
                </span>
                <div className="flex flex-wrap gap-2">
                  {FACE_SHAPES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFaceShape(f);
                        setAppearanceSource("User");
                        setEditingField(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        faceShape === f
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 py-3 px-6 shadow-md min-h-[44px] text-xs sm:text-sm font-bold whitespace-nowrap"
              >
                Confirm All & Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2B: MANUAL APPEARANCE SELECTION (IF PHOTO SKIPPED)                  */}
        {/* ========================================================================= */}
        {currentStep === 2 && !hasUploadedPhoto && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Tell us about your appearance
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select your closest skin tone palette, hair characteristics, and face shape.
              </p>
            </div>

            {/* 1. Interactive Skin Tone Palette */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Skin Tone Palette ({selectedSkinTone.name} • {selectedSkinTone.undertone} undertone)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SKIN_TONE_PALETTE.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => {
                      setSelectedSkinTone(tone);
                      setAppearanceSource("Manual");
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[64px] cursor-pointer ${
                      selectedSkinTone.id === tone.id
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)] bg-[var(--primary-soft)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full border shadow-sm"
                      style={{ backgroundColor: tone.hex }}
                    />
                    <span className="text-[10px] font-bold text-[var(--text-primary)] text-center line-clamp-1">
                      {tone.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Hair Colour & Texture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Hair Colour
                </label>
                <select
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value as HairColour)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
                >
                  {HAIR_COLOURS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Hair Texture
                </label>
                <select
                  value={hairTexture}
                  onChange={(e) => setHairTexture(e.target.value as HairTexture)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
                >
                  {HAIR_TEXTURES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Hair Length & Current Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Hair Length
                </label>
                <select
                  value={hairLength}
                  onChange={(e) => setHairLength(e.target.value as HairLength)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
                >
                  {HAIR_LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Current Hairstyle
                </label>
                <select
                  value={currentStyle}
                  onChange={(e) => setCurrentStyle(e.target.value as CurrentHairstyle)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
                >
                  {CURRENT_HAIRSTYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Face Shape */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Face Shape
              </label>
              <div className="flex flex-wrap gap-2">
                {FACE_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setFaceShape(shape)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[40px] cursor-pointer ${
                      faceShape === shape
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Profile Identity <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: IDENTITY & PERSONAL BIO                                           */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <User className="w-6 h-6 text-[var(--primary)]" />
                Your Identity & Profile
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Set your preferred name, personal style bio, and profile photo.
              </p>
            </div>

            {/* Profile Avatar / DP Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)]">
              <Avatar
                src={avatar}
                name={displayName || "You"}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-[var(--surface)] shadow-md"
              />
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Profile Display Picture (DP)
                </span>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraMode("dp");
                      setIsCameraOpen(true);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 transition-all shadow-2xs min-h-[38px] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Take Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => dpInputRef.current?.click()}
                    className="py-2 px-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 transition-all shadow-2xs min-h-[38px] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Upload DP
                  </button>
                </div>
              </div>
            </div>

            {/* Display Name Input */}
            <div className="space-y-1.5">
              <Input
                label="What should OP AI call you? (Display Name)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Madeshwaran"
              />
            </div>

            {/* Gender Preference & Fashion Category Focus */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                Fashion Focus & Gender Identity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "Women", label: "Women's Fashion", desc: "Dresses, tops, kurtis, heels, accessories" },
                  { id: "Men", label: "Men's Fashion", desc: "Shirts, trousers, kurtas, shoes, blazers" },
                  { id: "All", label: "All / Unisex", desc: "Explore all collections freely" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id as any)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[68px] cursor-pointer ${
                      gender === g.id
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] ring-2 ring-[var(--primary)]"
                        : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{g.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bio / Philosophy Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Personal Bio & Style Philosophy
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell OP AI about your daily lifestyle, preferred aesthetic, and how you like to dress..."
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Sizing & Fit <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SIZING & FIT SILHOUETTE                                          */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Ruler className="w-6 h-6 text-[var(--primary)]" />
                Sizing & Fit Parameters
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                These sizes will automatically pre-fill new wardrobe uploads and filter shopping suggestions.
              </p>
            </div>

            {/* Tops Size */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Tops Size
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPS_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTopsSize(s)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[40px] cursor-pointer ${
                      topsSize === s
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottoms & Shoes Sizes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Bottoms Waist (Inches)
                </label>
                <select
                  value={bottomsSize}
                  onChange={(e) => setBottomsSize(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs sm:text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[44px]"
                >
                  {BOTTOMS_SIZES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Input
                  label="Footwear Size"
                  value={shoesSize}
                  onChange={(e) => setShoesSize(e.target.value)}
                  placeholder="e.g. 10.5 US / 43 EU"
                />
              </div>
            </div>

            {/* Fit Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Preferred Clothing Fit & Silhouette
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FIT_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFitPreference(f)}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all min-h-[44px] cursor-pointer ${
                      fitPreference === f
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] ring-1 ring-[var(--primary)]"
                        : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {f} Fit
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Hairstyle Look <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: DESIRED HAIRSTYLE / LOOK PREFERENCES                              */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                What look or hairstyle do you want to maintain?
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Personal preferences guide our grooming and outfit pairing advisories.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DESIRED_HAIRSTYLE_OPTIONS.map((opt) => {
                const active = desiredHairstyles.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDesiredHairstyle(opt)}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between text-xs sm:text-sm font-bold transition-all min-h-[52px] cursor-pointer ${
                      active
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-sm"
                        : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <span className="leading-snug">{opt}</span>
                    {active && <Check className="w-4 h-4 text-[var(--primary)] flex-shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Smart Advisory (Section 9) */}
            {showNeatLongHairAdvisory && (
              <div className="p-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-start gap-3 animate-fade-in">
                <Info className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--text-primary)] space-y-1">
                  <span className="font-bold">✦ OP AI Style Advisory: </span>
                  <span>
                    Long hair can still maintain a neat, professional appearance, though regular
                    grooming and tidy styling may be required for formal settings.
                  </span>
                  <span className="text-[var(--text-secondary)] block font-medium">
                    Your preference is respected and prioritized.
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(6)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Style & Colors <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: EVERYDAY FASHION STYLE & COLOR PALETTE                            */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Everyday Style & Color Affinity
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select your preferred aesthetic vibes and color palette.
              </p>
            </div>

            {/* Fashion Aesthetics */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Everyday Fashion Aesthetics
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FASHION_STYLES.map((style) => {
                  const active = selectedStyles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between text-xs sm:text-sm font-bold transition-all min-h-[50px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-sm"
                          : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span>{style}</span>
                      {active && <Check className="w-4 h-4 text-[var(--primary)] flex-shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette Affinity */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
                Favorite Colors (Multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((c) => {
                  const active = selectedColors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleColor(c)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer min-h-[38px] ${
                        active
                          ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs"
                          : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
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

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(5)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(7)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Occasions <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: COMMON OCCASIONS & OUTFIT PRIORITIES                             */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Occasions & Outfit Priorities
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Where do you need outfits, and what matters most when choosing pieces?
              </p>
            </div>

            {/* Occasions */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                Where do you need outfit recommendations? (Multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => {
                  const active = selectedOccasions.includes(occ);
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => toggleOccasion(occ)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                          : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outfit Priorities */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[var(--primary)]" />
                What matters most when choosing an outfit?
              </label>
              <div className="flex flex-wrap gap-2">
                {OUTFIT_PRIORITIES.map((p) => {
                  const active = outfitPriorities.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleOutfitPriority(p)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                          : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(6)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(8)}
                className="flex items-center gap-2 py-3 px-6 min-h-[44px] text-xs sm:text-sm font-bold"
              >
                Continue to Final Step <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: SHOPPING PRIORITIES & REMINDERS                                  */}
        {/* ========================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Shopping & OP AI Proactivity
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configure how OP AI ranks recommendations and alerts you.
              </p>
            </div>

            {/* Shopping Priorities */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[var(--primary)]" />
                When OP AI recommends items, what should it prioritize?
              </label>
              <div className="flex flex-wrap gap-2">
                {SHOPPING_PRIORITIES.map((sp) => {
                  const active = shoppingPriorities.includes(sp);
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => toggleShoppingPriority(sp)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                          : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reminder Topics */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[var(--primary)]" />
                What would you like OP AI to remind you about?
              </label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_TOPICS.map((topic) => {
                  const active = reminderTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleReminderTopic(topic)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all min-h-[38px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm font-bold"
                          : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Proactivity Level */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[var(--primary)]" />
                How proactive should OP AI be?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PROACTIVITY_LEVELS.map((lvl) => {
                  const active = proactivity === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setProactivity(lvl)}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all min-h-[48px] cursor-pointer ${
                        active
                          ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] ring-2 ring-[var(--primary)]"
                          : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(7)}
                className="flex items-center gap-1.5 py-2.5 px-4 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleFinishOnboarding}
                disabled={isFinishing}
                className="flex items-center gap-2 py-3 px-8 shadow-lg bg-[var(--primary)] hover:opacity-95 min-h-[48px] text-xs sm:text-sm font-bold whitespace-nowrap"
              >
                {isFinishing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" /> Finalizing Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Complete Calibration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

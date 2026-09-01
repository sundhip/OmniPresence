"use client";

import React, { useState, useEffect } from "react";
import { WardrobeCategory, WardrobeItem, Season } from "@/types/wardrobe";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { wardrobeService } from "@/services/wardrobeService";
import { aiService, AIAnalysisResult } from "@/services/aiService";
import {
  PRIMARY_COLORS,
  EXTENDED_COLORS,
  ControlledColor,
} from "@/lib/colorVocabulary";
import {
  Upload,
  Camera,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Palette,
} from "lucide-react";
import { CameraCaptureModal } from "@/components/ui/CameraCaptureModal";
import { getColorHex } from "@/lib/utils";

export interface WardrobeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: WardrobeItem | null;
  onSaved?: (item: WardrobeItem) => void;
}

const CATEGORIES: WardrobeCategory[] = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
];

const SEASONS: Season[] = ["Spring", "Summer", "Autumn", "Winter", "All-Season"];

const OCCASIONS = [
  "Office",
  "Meeting",
  "Casual",
  "Everyday",
  "Weekend Casual",
  "Dinner",
  "Date",
  "Party",
  "Formal Event",
  "Travel",
  "Workout",
];

const FITS = ["Regular", "Slim", "Relaxed", "Tailored", "Oversized"];

const SAMPLE_CLOTHING_PHOTOS = [
  {
    name: "Red Evening Midi Dress",
    url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    label: "Red Dress",
  },
  {
    name: "Minimalist Black Oversized Tee",
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    label: "Black Tee",
  },
  {
    name: "Vintage Straight Blue Jeans",
    url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
    label: "Blue Jeans",
  },
  {
    name: "Espresso Suede Penny Loafers",
    url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80",
    label: "Brown Loafers",
  },
  {
    name: "Camel Structured Trench Coat",
    url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&auto=format&fit=crop&q=80",
    label: "Coat",
  },
];

export function WardrobeFormModal({
  isOpen,
  onClose,
  itemToEdit,
  onSaved,
}: WardrobeFormModalProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDetected, setAiDetected] = useState<AIAnalysisResult | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WardrobeCategory>("Tops");
  const [subcategory, setSubcategory] = useState("");
  const [color, setColor] = useState<string>("Black");
  const [secondaryColors, setSecondaryColors] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [fit, setFit] = useState("Regular");
  const [material, setMaterial] = useState("");
  const [season, setSeason] = useState<Season[]>(["All-Season"]);
  const [occasion, setOccasion] = useState<string[]>(["Everyday"]);
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || "");
      setCategory(itemToEdit.category || "Tops");
      setSubcategory(itemToEdit.subcategory || "");
      setColor(itemToEdit.color || "Black");
      setSecondaryColors(itemToEdit.secondaryColors || []);
      setBrand(itemToEdit.brand || "");
      setSize(itemToEdit.size || user?.sizes?.tops || "M");
      setFit(itemToEdit.fit || "Regular");
      setMaterial(itemToEdit.material || "");
      setSeason(itemToEdit.season || ["All-Season"]);
      setOccasion(itemToEdit.occasion || ["Everyday"]);
      setImageUrl(itemToEdit.imageUrl || "");
      setImagePreview(itemToEdit.imageUrl || "");
      setNotes(itemToEdit.notes || "");
      setAiDetected(null);
      setShowMoreDetails(true);
    } else {
      // Default to user's saved profile size
      const defaultUserSize = user?.sizes?.tops || "M";
      const defaultUserFit =
        user?.fitPreference && user.fitPreference !== "Not Specified"
          ? user.fitPreference
          : "Regular";

      setName("");
      setCategory("Tops");
      setSubcategory("");
      setColor("Black");
      setSecondaryColors([]);
      setBrand("");
      setSize(defaultUserSize);
      setFit(defaultUserFit);
      setMaterial("");
      setSeason(["All-Season"]);
      setOccasion(["Everyday"]);
      setImageUrl("");
      setImagePreview("");
      setNotes("");
      setAiDetected(null);
      setShowMoreDetails(false);
    }
    setErrors({});
    setIsAnalyzing(false);
    setAnalysisStep(0);
  }, [itemToEdit, isOpen, user]);

  // Run AI Analysis when an image is selected/uploaded
  const triggerAiAnalysis = async (imgSrc: string, contextHint?: string) => {
    setImagePreview(imgSrc);
    setImageUrl(imgSrc);
    setIsAnalyzing(true);
    setAnalysisStep(1);

    const stepTimer = setInterval(() => {
      setAnalysisStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 200);

    try {
      const result = await aiService.analyzeClothingImage(
        imgSrc,
        user,
        contextHint
      );
      clearInterval(stepTimer);

      setAiDetected(result);
      setName(result.name);
      setCategory(result.category);
      setSubcategory(result.subcategory);
      setColor(result.color);
      setSecondaryColors(result.secondaryColors || []);
      setFit(result.fit);
      setSize(result.size); // User profile size default!
      setOccasion(result.occasion);
      setSeason(result.season);
      if (result.material) setMaterial(result.material);
      if (result.brand) setBrand(result.brand);

      success("✦ OP AI Vision Detected", result.aiSummary);
    } catch (err: any) {
      clearInterval(stepTimer);
      console.warn("AI analysis fallback:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toastError("Image size must be under 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        triggerAiAnalysis(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (sample: { name: string; url: string }) => {
    triggerAiAnalysis(sample.url, sample.name);
  };

  const toggleSeason = (s: Season) => {
    if (season.includes(s)) {
      if (season.length > 1) setSeason(season.filter((item) => item !== s));
    } else {
      setSeason([...season, s]);
    }
  };

  const toggleOccasion = (occ: string) => {
    if (occasion.includes(occ)) {
      if (occasion.length > 1) setOccasion(occasion.filter((item) => item !== occ));
    } else {
      setOccasion([...occasion, occ]);
    }
  };

  const toggleSecondaryColor = (c: string) => {
    if (secondaryColors.includes(c)) {
      setSecondaryColors(secondaryColors.filter((item) => item !== c));
    } else {
      setSecondaryColors([...secondaryColors, c]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Item name is required";
    if (!category) newErrors.category = "Category is required";
    if (!color) newErrors.color = "Color is required";
    if (season.length === 0) newErrors.season = "Select at least one season";
    if (occasion.length === 0) newErrors.occasion = "Select at least one occasion";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const finalImage =
        imageUrl ||
        imagePreview ||
        `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80`;

      if (itemToEdit) {
        const updated = await wardrobeService.updateItem(itemToEdit.id, {
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || category,
          color,
          secondaryColors: secondaryColors.length > 0 ? secondaryColors : undefined,
          brand: brand.trim() || undefined,
          size: size.trim() || undefined,
          fit,
          material: material.trim() || undefined,
          season,
          occasion,
          imageUrl: finalImage,
          notes: notes.trim() || undefined,
        });
        success("Wardrobe item updated", `${updated.name} has been updated.`);
        if (onSaved) onSaved(updated);
      } else {
        const created = await wardrobeService.addItem({
          userId: user?.id || "user_active",
          name: name.trim(),
          category,
          subcategory: subcategory.trim() || category,
          color,
          secondaryColors: secondaryColors.length > 0 ? secondaryColors : undefined,
          brand: brand.trim() || undefined,
          size: size.trim() || undefined,
          fit,
          material: material.trim() || undefined,
          season,
          occasion,
          imageUrl: finalImage,
          wearCount: 0,
          favorite: false,
          notes: notes.trim() || undefined,
        });
        success("Added to Wardrobe", `${created.name} is now saved in your wardrobe.`);
        if (onSaved) onSaved(created);
      }
      onClose();
    } catch (err: any) {
      toastError("Failed to save clothing item", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? "Edit Clothing Piece" : "Add Clothing to Wardrobe"}
      description={
        itemToEdit
          ? "Update details, fit, colors, and style tags for this item."
          : "Upload a photo. OP AI will automatically identify the category, colors, fit, and size defaults."
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Camera Modal Component */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(img) => triggerAiAnalysis(img)}
          title="Take Clothing Photo"
          guideType="clothing"
        />

        {/* Step 1: Image Upload & AI Scanning */}
        {!itemToEdit && !imagePreview && !isAnalyzing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Upload Card */}
              <div className="relative border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-3xl p-6 text-center transition-all bg-[var(--surface-soft)] group cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Upload clothing photo"
                />
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--primary)] shadow-sm group-hover:scale-105 transition-transform mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Upload Clothing Photo
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Browse files or drop image
                </p>
              </div>

              {/* Take Photo Card */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-3xl p-6 text-center transition-all bg-[var(--surface-soft)] group cursor-pointer flex flex-col items-center justify-center min-h-[160px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--primary)] shadow-sm group-hover:scale-105 transition-transform mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Take Photo with Camera
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Live snapshot from your device
                </p>
              </button>
            </div>

            {/* Quick Demo Sample Photos */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Or test with sample clothing:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_CLOTHING_PHOTOS.map((sample) => (
                  <button
                    type="button"
                    key={sample.label}
                    onClick={() => handleSelectSamplePhoto(sample)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all cursor-pointer shadow-2xs min-h-[32px]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Scanning State UI */}
        {isAnalyzing && (
          <div className="p-8 rounded-3xl bg-[var(--surface-soft)] border border-[var(--primary)]/30 text-center space-y-4 animate-fade-in shadow-[var(--shadow-glow)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6657D9] to-[#C8B5FF] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">
                ✦ OP AI Analyzing Clothing...
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Extracting style properties and matching with {user?.name || "your"} profile.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2 text-left pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                <CheckCircle2
                  className={`w-4 h-4 ${analysisStep >= 1 ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}
                />
                <span>Identifying category & silhouette</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                <CheckCircle2
                  className={`w-4 h-4 ${analysisStep >= 2 ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}
                />
                <span>Detecting color palette & tone</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                <CheckCircle2
                  className={`w-4 h-4 ${analysisStep >= 3 ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}
                />
                <span>Understanding occasion suitability</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                <CheckCircle2
                  className={`w-4 h-4 ${analysisStep >= 4 ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}
                />
                <span>Applying size default ({user?.sizes?.tops || "M"})</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 & 3: Auto-Filled Review & Editable Form */}
        {(imagePreview || itemToEdit) && !isAnalyzing && (
          <div className="space-y-6">
            {/* AI Banner */}
            {aiDetected && (
              <div className="p-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-start gap-3 animate-fade-in">
                <Sparkles className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--text-primary)]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold">✦ OP AI Fashion Analysis: </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--primary)] font-bold border border-[var(--primary)]/20">
                      {aiDetected.model?.provider || "FashionCLIP"} • {aiDetected.model?.model || "EMaghakyan/fashion-clip"}
                    </span>
                  </div>
                  <span>
                    {aiDetected.name} ({aiDetected.category} • {aiDetected.color} • {aiDetected.fit} fit).
                  </span>
                  <span className="text-[var(--text-secondary)] block mt-0.5">
                    Pre-filled from visual analysis. You can modify any property before saving.
                  </span>
                </div>
              </div>
            )}

            {/* Photo Preview + Essential Primary Fields */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Image Preview Box */}
              <div className="w-full sm:w-44 aspect-[4/5] rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] relative overflow-hidden flex-shrink-0 group flex items-center justify-center shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain p-1 rounded-2xl"
                />
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold gap-1">
                  <RotateCcw className="w-4 h-4" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Core Primary Editable Fields */}
              <div className="flex-1 space-y-4 w-full">
                <Input
                  label="Clothing Name *"
                  placeholder="e.g. Red Evening Midi Dress"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Category *"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WardrobeCategory)}
                    error={errors.category}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Subcategory / Style"
                    placeholder="e.g. Midi Dress, Chinos"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>

                {/* Sizing & Fit (User profile size default, editable) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Size (Profile Default) *"
                      placeholder="e.g. M, L, 32"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      helperText={`Default from ${user?.name || "your"} profile`}
                    />
                  </div>

                  <div>
                    <Select
                      label="Fit Profile"
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
                    >
                      {FITS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary & Basic Controlled Color Swatches (Part 19, 20, 25) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Primary Color *
                </label>
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  Selected: <strong>{color}</strong>
                </span>
              </div>

              {/* Primary Basic Colors */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Basic Colors:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_COLORS.map((c) => {
                    const isSelected = color.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs scale-105"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                        <span>{c}</span>
                        {isSelected && <Check className="w-3 h-3 text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extended Shades */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Extended Shades:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXTENDED_COLORS.map((c) => {
                    const isSelected = color.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-xs scale-105"
                            : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full border border-black/10"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                        <span>{c}</span>
                        {isSelected && <Check className="w-3 h-3 text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {errors.color && <p className="text-xs text-[var(--error)] mt-1">{errors.color}</p>}
            </div>

            {/* Occasions Multi-Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Suitable Occasions *
              </label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => {
                  const isSelected = occasion.includes(occ);
                  return (
                    <button
                      type="button"
                      key={occ}
                      onClick={() => toggleOccasion(occ)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-2xs"
                          : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>
              {errors.occasion && <p className="text-xs text-[var(--error)] mt-1">{errors.occasion}</p>}
            </div>

            {/* Progressive Disclosure: More Details (Secondary Colors, Brand, Material, Season, Notes) */}
            <div className="border-t border-[var(--border-subtle)] pt-3">
              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer py-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {showMoreDetails
                    ? "Hide Optional Details"
                    : "Edit More Details (Secondary Colors, Brand, Material, Season, Notes)"}
                </span>
                {showMoreDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showMoreDetails && (
                <div className="space-y-4 pt-4 animate-fade-in">
                  {/* Secondary / Accent Colors (Part 22) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
                      Secondary / Accent Colors (For striped or multi-color pieces)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[...PRIMARY_COLORS, ...EXTENDED_COLORS].map((c) => {
                        const isSelected = secondaryColors.includes(c);
                        return (
                          <button
                            type="button"
                            key={c}
                            onClick={() => toggleSecondaryColor(c)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-2xs"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full border border-black/10"
                              style={{ backgroundColor: getColorHex(c) }}
                            />
                            <span>{c}</span>
                            {isSelected && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Brand (Optional)"
                      placeholder="e.g. Theory, Acne Studios"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                    <Input
                      label="Material (Optional)"
                      placeholder="e.g. 100% Silk, Cashmere Blend"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    />
                  </div>

                  {/* Season Multi-Select */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                      Seasons
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map((s) => {
                        const isSelected = season.includes(s);
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => toggleSeason(s)}
                            className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] font-bold shadow-2xs"
                                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Styling Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Care & Styling Notes
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Best paired with statement heels or layered under structured blazers."
                      className="w-full p-3 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow)] transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setImagePreview("");
                  setImageUrl("");
                  setAiDetected(null);
                }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Reset Image
              </button>

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {itemToEdit ? "Save Changes" : "Add to Wardrobe"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

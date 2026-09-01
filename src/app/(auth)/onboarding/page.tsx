"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { StylePreference, ColorPreference, OccasionType, FitPreference } from "@/types/user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { aiService } from "@/services/aiService";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, MessageSquare, Check } from "lucide-react";
import { getColorHex } from "@/lib/utils";
import confetti from "canvas-confetti";

const STYLE_CHOICES: StylePreference[] = [
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

const COLOR_CHOICES: ColorPreference[] = [
  "Black",
  "White",
  "Navy",
  "Grey",
  "Beige",
  "Olive",
  "Brown",
  "Burgundy",
  "Pink",
  "Cyan",
  "Blue",
  "Tan",
];

const OCCASION_CHOICES: OccasionType[] = [
  "Office",
  "Meeting",
  "Everyday",
  "Weekend Casual",
  "Dinner",
  "Date",
  "Party",
  "Formal Event",
  "Travel",
  "Workout",
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];
const FIT_CHOICES: FitPreference[] = ["Regular", "Slim", "Relaxed", "Oversized"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || "Hero");
  const [naturalStyleInput, setNaturalStyleInput] = useState("");
  const [styles, setStyles] = useState<StylePreference[]>(["Casual", "Minimal"]);
  const [colors, setColors] = useState<ColorPreference[]>(["Black", "White", "Navy"]);
  const [occasions, setOccasions] = useState<OccasionType[]>(["Everyday", "Office"]);
  const [topsSize, setTopsSize] = useState(user?.sizes?.tops || "L");
  const [bottomsSize, setBottomsSize] = useState(user?.sizes?.bottoms || "34");
  const [shoesSize, setShoesSize] = useState(user?.sizes?.shoes || "10.5 US");
  const [fitPreference, setFitPreference] = useState<FitPreference>("Regular");
  const [isFinishing, setIsFinishing] = useState(false);

  const totalSteps = 5;

  const toggleStyle = (s: StylePreference) => {
    setStyles((prev) => (prev.includes(s) ? prev.filter((i) => i !== s) : [...prev, s]));
  };

  const toggleColor = (c: ColorPreference) => {
    setColors((prev) => (prev.includes(c) ? prev.filter((i) => i !== c) : [...prev, c]));
  };

  const toggleOccasion = (o: OccasionType) => {
    setOccasions((prev) => (prev.includes(o) ? prev.filter((i) => i !== o) : [...prev, o]));
  };

  // Natural Language Style Parse (Part 21, 22)
  const handleParseNaturalStyle = () => {
    if (!naturalStyleInput.trim()) return;
    const parsed = aiService.parseNaturalLanguagePreferences(naturalStyleInput);

    setColors(parsed.preferredColors as ColorPreference[]);
    setStyles(parsed.preferredStyles as StylePreference[]);
    setFitPreference(parsed.fitPreference as FitPreference);
    setOccasions(parsed.preferredOccasions as OccasionType[]);

    success(
      "✦ OP AI Understood Your Style",
      `Understood: ${parsed.fitPreference} fit, ${parsed.preferredColors.join(", ")} colors.`
    );
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await updateUser({
        name,
        stylePreferences: styles,
        colorPreferences: colors,
        occasionPreferences: occasions,
        fitPreference,
        sizes: {
          tops: topsSize,
          bottoms: bottomsSize,
          shoes: shoesSize,
        },
        onboarded: true,
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      success("Welcome to OmniPresence", `${name}'s personal intelligence profile is active.`);
      router.push("/home");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div
        className="w-full max-w-xl p-8 sm:p-10 rounded-3xl border shadow-2xl space-y-8 animate-fade-in"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 text-[var(--primary)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              OP AI Calibration
            </span>
            <span>Step {step} of {totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                How should OP AI address you?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Your profile will personalize recommendations, sizes, and daily intelligence.
              </p>
            </div>
            <Input
              label="Your Preferred Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hero"
              className="h-12 text-base rounded-2xl"
              required
            />
          </div>
        )}

        {/* Step 2: Natural Language Style & Aesthetics (Part 21, 22) */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                What are your style aesthetics?
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Describe your style in plain English or select aesthetic tags.
              </p>
            </div>

            {/* Natural language express box */}
            <div className="p-4 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                Describe your style naturally (Optional):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={naturalStyleInput}
                  onChange={(e) => setNaturalStyleInput(e.target.value)}
                  placeholder="e.g. I usually wear oversized black clothes and prefer casual outfits."
                  className="flex-1 p-2.5 text-xs rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleParseNaturalStyle}>
                  Interpret
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {STYLE_CHOICES.map((s) => {
                const isSelected = styles.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-xs scale-105"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {s} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Colors */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Your preferred color palette
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Choose the tones you feel most confident wearing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_CHOICES.map((c) => {
                const isSelected = colors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColor(c)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-xs scale-105"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10"
                      style={{ backgroundColor: getColorHex(c) }}
                    />
                    <span>{c}</span>
                    {isSelected && <Check className="w-3 h-3 text-[var(--primary)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Occasions */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Your frequent occasions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Where do you spend most of your weekly schedule?
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {OCCASION_CHOICES.map((o) => {
                const isSelected = occasions.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleOccasion(o)}
                    className={`px-4 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs scale-105"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Sizing & Fit Preferences (Part 14, 15, 17, 18) */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Sizing & Fit Profile
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Your saved size will automatically pre-fill new clothing pieces when you upload them.
              </p>
            </div>

            {/* Standard Size Selector for Tops */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Standard Tops Size (Default for new shirts & jackets) *
              </label>
              <div className="flex flex-wrap gap-2">
                {STANDARD_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTopsSize(sz)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      topsSize === sz
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs scale-105"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Preferred Fit Style
              </label>
              <div className="flex flex-wrap gap-2">
                {FIT_CHOICES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFitPreference(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      fitPreference === f
                        ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] font-bold shadow-xs scale-105"
                        : "bg-[var(--surface-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottoms & Shoes */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <Input
                label="Bottoms Size (Waist)"
                value={bottomsSize}
                onChange={(e) => setBottomsSize(e.target.value)}
                placeholder="e.g. 32, 34"
              />
              <Input
                label="Footwear Size"
                value={shoesSize}
                onChange={(e) => setShoesSize(e.target.value)}
                placeholder="e.g. 10.5 US"
              />
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={() => setStep(step - 1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={handleFinish}
              className="text-[var(--text-muted)]"
            >
              Skip Setup
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(step + 1)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleFinish}
              isLoading={isFinishing}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Enter OmniPresence
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

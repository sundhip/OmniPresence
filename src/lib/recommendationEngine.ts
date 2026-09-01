import { WardrobeItem } from "@/types/wardrobe";
import { UserProfile } from "@/types/user";
import {
  RecommendationCandidate,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScoreBreakdown,
} from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";
import { generateId } from "./utils";

// Color harmony pairings for intelligent matching
const COLOR_HARMONIES: Record<string, string[]> = {
  black: ["white", "grey", "beige", "olive", "burgundy", "charcoal", "tan", "black", "navy", "red", "cream"],
  white: ["black", "navy", "grey", "beige", "olive", "blue", "burgundy", "tan", "charcoal", "red", "cream"],
  navy: ["white", "beige", "grey", "tan", "brown", "khaki", "burgundy", "navy", "cream"],
  grey: ["black", "white", "navy", "burgundy", "blue", "pink", "charcoal", "red"],
  beige: ["black", "navy", "white", "brown", "olive", "charcoal", "burgundy", "cream"],
  olive: ["white", "black", "beige", "tan", "grey", "navy", "cream"],
  brown: ["beige", "white", "navy", "cream", "tan", "blue"],
  burgundy: ["black", "grey", "white", "navy", "beige", "cream"],
  red: ["black", "white", "navy", "grey", "charcoal", "beige"],
  blue: ["white", "beige", "grey", "black", "navy", "brown"],
  cream: ["black", "navy", "olive", "brown", "burgundy", "tan"],
};

export class RecommendationEngine {
  public static generateRecommendation(
    wardrobe: WardrobeItem[],
    profile: UserProfile,
    request: RecommendationRequest
  ): RecommendationResponse {
    const targetOccasion = request.occasion.toLowerCase();
    const excludeIds = new Set(request.excludeItemIds || []);
    const weather = request.weather;

    // Filter available items
    const availableItems = wardrobe.filter((i) => !excludeIds.has(i.id));

    // Group by category
    const tops = availableItems.filter((i) => i.category === "Tops");
    const bottoms = availableItems.filter((i) => i.category === "Bottoms");
    const dresses = availableItems.filter((i) => i.category === "Dresses");
    const shoes = availableItems.filter((i) => i.category === "Shoes");
    const outerwear = availableItems.filter((i) => i.category === "Outerwear");
    const accessories = availableItems.filter((i) => i.category === "Accessories");

    const candidateCombinations: {
      items: WardrobeItem[];
      name: string;
      vibe: string;
      weatherNote?: string;
    }[] = [];

    // Form 2-piece and 3/4-piece candidate sets (Top + Bottom + Shoes + optional Outerwear/Accessory)
    if (tops.length > 0 && bottoms.length > 0 && shoes.length > 0) {
      for (const top of tops) {
        for (const bottom of bottoms) {
          for (const shoe of shoes) {
            const combo: WardrobeItem[] = [top, bottom, shoe];

            // Outerwear logic influenced by temperature/weather
            const shouldAddOuterwear =
              weather && (weather.temperature <= 21 || weather.condition === "Rainy");

            if (shouldAddOuterwear && outerwear.length > 0) {
              const matchingOuterwear =
                outerwear.find((o) =>
                  o.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion))
                ) || outerwear[0];
              if (matchingOuterwear) combo.push(matchingOuterwear);
            } else if (outerwear.length > 0 && Math.random() > 0.6) {
              // Occasional light layer
              const matchingOuterwear = outerwear.find(
                (o) =>
                  o.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion)) ||
                  (top.color === "White" && o.color === "Black")
              );
              if (matchingOuterwear) combo.push(matchingOuterwear);
            }

            // Optionally add accessory (watch/belt)
            const matchingAccessory = accessories.find((a) => a.favorite || a.wearCount > 5);
            if (matchingAccessory && Math.random() > 0.4) {
              combo.push(matchingAccessory);
            }

            candidateCombinations.push({
              items: combo,
              name: `${top.name.split(" ")[0]} + ${bottom.name.split(" ")[0]} Ensemble`,
              vibe: this.inferVibe(combo, targetOccasion),
            });
          }
        }
      }
    }

    // Form Dress + Shoes combinations
    if (dresses.length > 0 && shoes.length > 0) {
      for (const dress of dresses) {
        for (const shoe of shoes) {
          const combo: WardrobeItem[] = [dress, shoe];
          if (outerwear.length > 0 && weather && weather.temperature <= 20) {
            combo.push(outerwear[0]);
          }

          candidateCombinations.push({
            items: combo,
            name: `${dress.name} Set`,
            vibe: "Elegant & Streamlined",
          });
        }
      }
    }

    // Fallback if wardrobe is small
    if (candidateCombinations.length === 0) {
      const allSelected = availableItems.slice(0, 4);
      candidateCombinations.push({
        items: allSelected,
        name: "Personal Signature Blend",
        vibe: "Essential Rotation",
      });
    }

    // Score all candidates
    const scoredCandidates: RecommendationCandidate[] = candidateCombinations.map((combo) => {
      const breakdown = this.calculateBreakdown(combo.items, profile, request, weather);
      const rationale = this.generateRationale(combo.items, breakdown, request, profile, weather);
      const stylingTips = this.generateStylingTips(combo.items, request, weather);

      let weatherNote: string | undefined = undefined;
      if (weather) {
        if (weather.temperature >= 28) {
          weatherNote = `Lightweight & breathable for ${weather.temperature}°C ${weather.condition}`;
        } else if (weather.temperature <= 18) {
          weatherNote = `Warm layered look for ${weather.temperature}°C cool conditions`;
        } else if (weather.condition === "Rainy" || weather.precipitation.toLowerCase().includes("rain")) {
          weatherNote = `Rain-friendly ensemble for wet conditions`;
        } else {
          weatherNote = `Comfortable for ${weather.temperature}°C ${weather.condition}`;
        }
      }

      return {
        id: generateId("rec"),
        name: combo.name,
        items: combo.items,
        score: breakdown.totalScore,
        breakdown,
        rationale,
        stylingTips,
        vibe: combo.vibe,
        occasionMatch: request.occasion,
        weatherNote,
      };
    });

    // Sort by total score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Select primary and distinct alternatives
    const primary = scoredCandidates[0];
    const alternatives = scoredCandidates
      .slice(1)
      .filter((c) => c.items[0]?.id !== primary.items[0]?.id || c.items[1]?.id !== primary.items[1]?.id)
      .slice(0, 2);

    let explanation = `OP AI curated this look specifically for your **${request.occasion}** occasion.`;
    if (weather) {
      explanation += ` Factoring in today's **${weather.temperature}°C • ${weather.condition}** weather in ${weather.location}, the ensemble favors comfortable thermal balance alongside your aesthetic preferences (${profile.stylePreferences.slice(0, 2).join(", ")}).`;
    } else {
      explanation += ` It harmonizes your preferred style aesthetics (${profile.stylePreferences.slice(0, 2).join(", ")}) while maintaining optimal wardrobe rotation for items not worn recently.`;
    }

    return {
      primary,
      alternatives,
      source: "deterministic_engine",
      explanation,
      weather,
      generatedAt: new Date().toISOString(),
    };
  }

  private static calculateBreakdown(
    items: WardrobeItem[],
    profile: UserProfile,
    request: RecommendationRequest,
    weather?: WeatherContext
  ): RecommendationScoreBreakdown {
    const targetOccasion = request.occasion.toLowerCase();

    // 1. Occasion Fit (25% weight)
    let occasionMatches = 0;
    items.forEach((item) => {
      const match = item.occasion.some(
        (occ) =>
          occ.toLowerCase().includes(targetOccasion) ||
          targetOccasion.includes(occ.toLowerCase()) ||
          occ.toLowerCase() === "everyday" ||
          occ.toLowerCase() === "casual"
      );
      if (match) occasionMatches++;
    });
    const occasionFit = Math.min(100, Math.round((occasionMatches / items.length) * 100 + 15));

    // 2. Preference Match (20% weight)
    let prefScore = 60;
    const userColors = (profile.colorPreferences || []).map((c) => c.toLowerCase());
    const userFits = (profile.fitPreferences || []).map((f) => f.toLowerCase());
    if (profile.fitPreference && profile.fitPreference !== "Not Specified") {
      userFits.push(profile.fitPreference.toLowerCase());
    }
    items.forEach((item) => {
      if (userColors.includes(item.color.toLowerCase())) prefScore += 8;
      if (item.fit && userFits.includes(item.fit.toLowerCase())) prefScore += 6;
      if (item.favorite) prefScore += 6;
    });
    const preferenceMatch = Math.min(100, prefScore);

    // 3. Weather Compatibility (20% weight)
    let weatherScore = 80;
    if (weather) {
      const temp = weather.temperature;
      const isRainy =
        weather.condition === "Rainy" ||
        weather.condition === "Stormy" ||
        weather.precipitation.toLowerCase().includes("rain");

      items.forEach((item) => {
        const cat = item.category;
        const sub = item.subcategory.toLowerCase();
        const mat = (item.material || "").toLowerCase();

        // Warm / Hot Weather (>= 28°C)
        if (temp >= 28) {
          if (cat === "Outerwear" && (sub.includes("wool") || sub.includes("coat") || sub.includes("heavy"))) {
            weatherScore -= 25; // Too hot for heavy coats
          }
          if (sub.includes("sweater") || sub.includes("turtleneck")) {
            weatherScore -= 15;
          }
          if (sub.includes("t-shirt") || sub.includes("tee") || sub.includes("linen") || cat === "Dresses") {
            weatherScore += 10; // Breathable
          }
          if (["white", "beige", "cream", "blue"].includes(item.color.toLowerCase())) {
            weatherScore += 5; // Light reflective tones
          }
        }
        // Mild / Cool Weather (<= 18°C)
        else if (temp <= 18) {
          if (cat === "Outerwear" || sub.includes("jacket") || sub.includes("blazer") || sub.includes("coat")) {
            weatherScore += 15; // Protective layer
          }
          if (sub.includes("sweater") || sub.includes("knit") || sub.includes("trousers")) {
            weatherScore += 10;
          }
        }

        // Rainy conditions
        if (isRainy) {
          if (sub.includes("suede") || sub.includes("canvas")) {
            weatherScore -= 15; // Avoid delicate suede/canvas in rain
          }
          if (sub.includes("boot") || sub.includes("leather") || cat === "Outerwear") {
            weatherScore += 10;
          }
        }
      });
    }
    const weatherCompatibility = Math.min(100, Math.max(40, weatherScore));

    // 4. Color Compatibility (15% weight)
    let colorScore = 70;
    if (items.length >= 2) {
      const color1 = items[0].color.toLowerCase();
      const color2 = items[1].color.toLowerCase();
      if (color1 === color2) {
        colorScore += 15; // Monochrome harmony
      } else if (COLOR_HARMONIES[color1]?.includes(color2)) {
        colorScore += 25; // Complementary pairing
      }
    }
    const colorCompatibility = Math.min(100, colorScore);

    // 5. Recent Wear Balance (10% weight)
    let wearScore = 80;
    const now = new Date().getTime();
    items.forEach((item) => {
      if (item.lastWorn) {
        const diffDays = Math.floor((now - new Date(item.lastWorn).getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) wearScore -= 20; // worn today
        else if (diffDays >= 7) wearScore += 10; // good rotation
      } else {
        wearScore += 15; // fresh unworn piece
      }
    });
    const recentWearBalance = Math.min(100, Math.max(30, wearScore));

    // 6. Wardrobe Availability & Completeness (10% weight)
    const hasTop = items.some((i) => i.category === "Tops" || i.category === "Dresses");
    const hasBottom = items.some((i) => i.category === "Bottoms" || i.category === "Dresses");
    const hasShoes = items.some((i) => i.category === "Shoes");
    const wardrobeAvailability = hasTop && hasBottom && hasShoes ? 100 : 70;

    // Weighted Total Score (0-100)
    const totalScore = Math.round(
      occasionFit * 0.25 +
        preferenceMatch * 0.2 +
        weatherCompatibility * 0.2 +
        colorCompatibility * 0.15 +
        recentWearBalance * 0.1 +
        wardrobeAvailability * 0.1
    );

    return {
      occasionFit,
      preferenceMatch,
      weatherCompatibility,
      colorCompatibility,
      recentWearBalance,
      wardrobeAvailability,
      totalScore,
    };
  }

  private static generateRationale(
    items: WardrobeItem[],
    breakdown: RecommendationScoreBreakdown,
    request: RecommendationRequest,
    profile: UserProfile,
    weather?: WeatherContext
  ): string[] {
    const reasons: string[] = [];

    // Weather rationale
    if (weather) {
      if (weather.temperature >= 28) {
        if (profile.fitPreference === "Oversized") {
          reasons.push(
            `You prefer oversized fits, so I kept that preference while selecting your lightest, most breathable pieces for today's **${weather.temperature}°C** weather.`
          );
        } else {
          reasons.push(
            `Comfortably balanced for today's **${weather.temperature}°C • ${weather.condition}** weather with lightweight, breathable pieces.`
          );
        }
      } else if (weather.temperature <= 18) {
        reasons.push(
          `Layered with structural warmth suited for **${weather.temperature}°C** cooler conditions.`
        );
      } else if (weather.condition === "Rainy" || weather.precipitation.toLowerCase().includes("rain")) {
        reasons.push(
          `Rain-conscious selection avoiding delicate materials and ensuring weather protection.`
        );
      } else {
        reasons.push(
          `Optimal fabric weight calibrated for today's **${weather.temperature}°C** temperature.`
        );
      }
    }

    // Style match rationale
    if (profile.stylePreferences.length > 0) {
      reasons.push(`Aligned with your **${profile.stylePreferences[0]}** aesthetic.`);
    }

    // Occasion rationale
    reasons.push(`Constructed specifically for **${request.occasion}** environments.`);

    // Color harmony rationale
    const itemColors = Array.from(new Set(items.map((i) => i.color)));
    if (itemColors.length > 1) {
      reasons.push(
        `Balanced palette featuring **${itemColors.slice(0, 2).join(" and ")}** tones.`
      );
    }

    // Rotation rationale
    const freshItems = items.filter((i) => !i.lastWorn || i.wearCount < 6);
    if (freshItems.length > 0) {
      reasons.push(`Brings ${freshItems[0].name} into active rotation.`);
    }

    return reasons;
  }

  private static generateStylingTips(
    items: WardrobeItem[],
    request: RecommendationRequest,
    weather?: WeatherContext
  ): string[] {
    const tips: string[] = [];
    const hasOvershirt = items.some((i) => i.subcategory.toLowerCase().includes("overshirt"));
    const hasSneakers = items.some((i) => i.subcategory.toLowerCase().includes("sneaker"));
    const hasOxford = items.some((i) => i.subcategory.toLowerCase().includes("button-up") || i.subcategory.toLowerCase().includes("shirt"));

    if (weather && weather.temperature >= 28) {
      tips.push("Unbutton top two collar buttons for optimal airflow and a relaxed summer silhouette.");
    } else if (hasOvershirt) {
      tips.push("Leave the overshirt unbuttoned for an effortless layered drape.");
    }

    if (hasOxford && (!weather || weather.temperature < 28)) {
      tips.push("Roll cuffs once and keep top button undone for modern smart-casual balance.");
    }
    if (hasSneakers) {
      tips.push("Ensure clean white profile for sharp contrast against darker trousers.");
    }
    if (tips.length === 0) {
      tips.push("Pair with your minimalist accessories to complete the look.");
    }

    return tips;
  }

  private static inferVibe(items: WardrobeItem[], occasion: string): string {
    if (occasion.includes("office") || occasion.includes("meeting")) {
      return "Refined Smart Casual";
    }
    if (occasion.includes("dinner") || occasion.includes("date")) {
      return "Monochrome Sophistication";
    }
    if (occasion.includes("casual") || occasion.includes("weekend")) {
      return "Architectural Relaxed";
    }
    return "Curated Signature";
  }
}

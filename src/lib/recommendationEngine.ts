import { WardrobeItem } from "@/types/wardrobe";
import { UserProfile } from "@/types/user";
import {
  RecommendationCandidate,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScoreBreakdown,
  CarryItemRecommendation,
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

    // Generate intelligent Carry / Accessory recommendations
    const carryRecommendations = this.generateCarryRecommendations(
      availableItems,
      weather,
      request.occasion
    );

    const candidateCombinations: {
      items: WardrobeItem[];
      name: string;
      vibe: string;
      weatherNote?: string;
    }[] = [];

    // Form Top + Bottom + Shoes combinations
    if (tops.length > 0 && bottoms.length > 0 && shoes.length > 0) {
      for (const top of tops) {
        for (const bottom of bottoms) {
          for (const shoe of shoes) {
            const combo: WardrobeItem[] = [top, bottom, shoe];

            // Outerwear logic influenced by temperature/weather
            const shouldAddOuterwear =
              weather && (weather.temperature <= 18 || weather.condition === "Rainy" || weather.condition === "Stormy");

            if (shouldAddOuterwear && outerwear.length > 0) {
              const matchingOuterwear =
                outerwear.find((o) =>
                  o.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion))
                ) || outerwear[0];
              if (matchingOuterwear) combo.push(matchingOuterwear);
            } else if (outerwear.length > 0 && Math.random() > 0.6) {
              const matchingOuterwear = outerwear.find(
                (o) =>
                  o.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion)) ||
                  (top.color === "White" && o.color === "Black")
              );
              if (matchingOuterwear) combo.push(matchingOuterwear);
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
          if (outerwear.length > 0 && weather && weather.temperature <= 19) {
            combo.push(outerwear[0]);
          }
          candidateCombinations.push({
            items: combo,
            name: `${dress.name.split(" ")[0]} Statement Look`,
            vibe: this.inferVibe(combo, targetOccasion),
          });
        }
      }
    }

    // Fallback if wardrobe is small
    if (candidateCombinations.length === 0 && wardrobe.length > 0) {
      const fallbackCombo = wardrobe.slice(0, 3);
      candidateCombinations.push({
        items: fallbackCombo,
        name: "Essential Signature Ensemble",
        vibe: "Curated Minimalist",
      });
    }

    // Score all candidates
    const scoredCandidates: RecommendationCandidate[] = candidateCombinations.map((combo) => {
      const breakdown = this.calculateScores(combo.items, profile, request, weather);
      const rationale = this.generateRationale(combo.items, breakdown, request, profile, weather);
      const stylingTips = this.generateStylingTips(combo.items, request, weather);

      let weatherReason: string | undefined = undefined;
      if (weather) {
        if (carryRecommendations.length > 0) {
          weatherReason = carryRecommendations.map((c) => c.reason).join(" ");
        } else if (weather.temperature >= 28) {
          weatherReason = `I selected lighter, breathable options for today's ${weather.temperature}°C temperature.`;
        } else if (weather.temperature <= 18) {
          weatherReason = `I added warmth and protective layering for the ${weather.temperature}°C cool weather.`;
        }
      }

      return {
        id: generateId("cand"),
        name: combo.name,
        items: combo.items,
        carryItems: carryRecommendations,
        score: breakdown.totalScore,
        breakdown,
        rationale,
        stylingTips,
        vibe: combo.vibe,
        occasionMatch: request.occasion,
        weatherNote: weather ? `${weather.temperature}°C • ${weather.condition}` : undefined,
        weatherReason,
      };
    });

    // Sort descending by total score
    scoredCandidates.sort((a, b) => b.score - a.score);

    const primary = scoredCandidates[0] || {
      id: generateId("cand"),
      name: "Classic Minimalist Look",
      items: wardrobe.slice(0, 3),
      carryItems: carryRecommendations,
      score: 85,
      breakdown: {
        occasionFit: 85,
        preferenceMatch: 80,
        weatherCompatibility: 85,
        colorCompatibility: 85,
        recentWearBalance: 80,
        wardrobeAvailability: 90,
        totalScore: 85,
      },
      rationale: ["Balanced everyday styling from your curated collection."],
      stylingTips: ["Pair with minimalist accents for effortless wear."],
      vibe: "Modern Minimalist",
      occasionMatch: request.occasion,
    };

    const alternatives = scoredCandidates.slice(1, 4);

    let explanation = `Curated for **${request.occasion}** based on your style preferences and current rotation.`;
    if (weather) {
      if (carryRecommendations.some((c) => c.type === "umbrella")) {
        explanation = `I chose a comfortable outfit for today and added an umbrella because rain is expected in your area.`;
      } else if (weather.temperature >= 28) {
        explanation = `I chose a lighter outfit for the warm ${weather.temperature}°C weather.`;
      } else if (weather.temperature <= 18) {
        explanation = `I layered for the cooler ${weather.temperature}°C weather today.`;
      }
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

  /**
   * Generate contextually justified carry and accessory recommendations
   */
  public static generateCarryRecommendations(
    wardrobe: WardrobeItem[],
    weather?: WeatherContext,
    occasion?: string
  ): CarryItemRecommendation[] {
    const carry: CarryItemRecommendation[] = [];
    if (!weather) return carry;

    const accessories = wardrobe.filter((i) => i.category === "Accessories");
    const isRainy =
      weather.condition === "Rainy" ||
      weather.condition === "Stormy" ||
      (weather.precipitationProbability !== undefined
        ? weather.precipitationProbability >= 40
        : !weather.precipitation.toLowerCase().includes("no rain") &&
          (weather.precipitation.toLowerCase().includes("rain") ||
            weather.precipitation.toLowerCase().includes("shower") ||
            weather.precipitation.toLowerCase().includes("drizzle")));

    // 1. Umbrella Logic (Section 21 & 22)
    // Only recommend if rain probability is meaningful (>= 40% or Rainy/Stormy)
    if (isRainy) {
      const wardrobeUmbrella = accessories.find((a) => a.name.toLowerCase().includes("umbrella"));
      carry.push({
        type: "umbrella",
        name: wardrobeUmbrella ? wardrobeUmbrella.name : "Umbrella",
        reason:
          weather.precipitationProbability && weather.precipitationProbability >= 40
            ? `Rain probability is ${weather.precipitationProbability}% today.`
            : "Rain is expected in your area.",
        icon: "☂",
        fromWardrobe: Boolean(wardrobeUmbrella),
        wardrobeItemId: wardrobeUmbrella?.id,
        item: wardrobeUmbrella,
      });
    }

    // 2. Sunglasses Logic (Section 23 & 24)
    // Strong sunlight, UV index >= 6, or hot sunny day (>= 29°C & Sunny/Clear)
    const isHighSun =
      (weather.uvIndex && weather.uvIndex >= 6) ||
      (weather.temperature >= 29 && (weather.condition === "Sunny" || weather.condition === "Clear"));

    if (isHighSun && !isRainy) {
      const wardrobeSunglasses = accessories.find(
        (a) =>
          a.name.toLowerCase().includes("sunglasses") ||
          a.name.toLowerCase().includes("glasses") ||
          a.subcategory.toLowerCase().includes("sunglasses")
      );

      carry.push({
        type: "sunglasses",
        name: wardrobeSunglasses ? wardrobeSunglasses.name : "Sunglasses",
        reason:
          weather.uvIndex && weather.uvIndex >= 6
            ? `High UV Index (${weather.uvIndex}) and strong sunlight expected.`
            : `Bright sunny conditions at ${weather.temperature}°C.`,
        icon: "🕶️",
        fromWardrobe: Boolean(wardrobeSunglasses),
        wardrobeItemId: wardrobeSunglasses?.id,
        item: wardrobeSunglasses,
      });

      // Cap logic: if user has a cap in wardrobe or hot outdoor context
      const wardrobeCap = accessories.find(
        (a) =>
          a.name.toLowerCase().includes("cap") ||
          a.name.toLowerCase().includes("hat") ||
          a.subcategory.toLowerCase().includes("cap")
      );
      if (wardrobeCap) {
        carry.push({
          type: "cap",
          name: wardrobeCap.name,
          reason: "Sun protection for bright outdoor conditions.",
          icon: "🧢",
          fromWardrobe: true,
          wardrobeItemId: wardrobeCap.id,
          item: wardrobeCap,
        });
      }
    }

    // 3. Cool Weather Outer Layer / Scarf Carry
    if (weather.temperature <= 16 && !isRainy) {
      const scarf = accessories.find((a) => a.name.toLowerCase().includes("scarf"));
      if (scarf) {
        carry.push({
          type: "scarf",
          name: scarf.name,
          reason: `Temperature drops to ${weather.temperature}°C.`,
          icon: "🧣",
          fromWardrobe: true,
          wardrobeItemId: scarf.id,
          item: scarf,
        });
      }
    }

    return carry;
  }

  private static calculateScores(
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

    // Factor in Skin Tone Undertone Color Harmony
    const skinUndertone = profile.appearance?.skinTone?.undertone;
    const warmHarmonies = ["beige", "olive", "brown", "cream", "mustard", "tan", "red", "orange", "earth tones"];
    const coolHarmonies = ["navy", "white", "black", "grey", "blue", "burgundy", "charcoal", "emerald"];

    items.forEach((item) => {
      const itemColor = item.color.toLowerCase();
      if (userColors.includes(itemColor)) prefScore += 8;
      if (item.fit && userFits.includes(item.fit.toLowerCase())) prefScore += 6;
      if (item.favorite) prefScore += 6;

      // Skin Tone Harmony Bonus
      if (skinUndertone === "Warm" && warmHarmonies.includes(itemColor)) {
        prefScore += 4;
      } else if (skinUndertone === "Cool" && coolHarmonies.includes(itemColor)) {
        prefScore += 4;
      }

      // Outfit Priorities Alignment
      if (profile.outfitPriorities?.includes("Comfort") && (item.fit === "Relaxed" || item.fit === "Regular")) {
        prefScore += 3;
      }
      if (profile.outfitPriorities?.includes("Professional Appearance") && (item.category === "Outerwear" || item.subcategory?.toLowerCase().includes("shirt"))) {
        prefScore += 3;
      }
    });
    const preferenceMatch = Math.min(100, prefScore);

    // 3. Weather Compatibility (20% weight)
    let weatherScore = 80;
    if (weather) {
      const temp = weather.temperature;
      const isRainy =
        weather.condition === "Rainy" ||
        weather.condition === "Stormy" ||
        (weather.precipitationProbability !== undefined
          ? weather.precipitationProbability >= 40
          : !weather.precipitation.toLowerCase().includes("no rain") &&
            (weather.precipitation.toLowerCase().includes("rain") ||
              weather.precipitation.toLowerCase().includes("shower") ||
              weather.precipitation.toLowerCase().includes("drizzle")));

      items.forEach((item) => {
        const cat = item.category;
        const sub = item.subcategory.toLowerCase();

        // Hot Weather (>= 28°C)
        if (temp >= 28) {
          if (cat === "Outerwear" && (sub.includes("wool") || sub.includes("coat") || sub.includes("heavy"))) {
            weatherScore -= 25; // Too hot for heavy coats
          }
          if (sub.includes("sweater") || sub.includes("turtleneck")) {
            weatherScore -= 15;
          }
          if (sub.includes("t-shirt") || sub.includes("tee") || sub.includes("shirt") || cat === "Dresses") {
            weatherScore += 10;
          }
          if (["white", "beige", "cream", "blue", "red"].includes(item.color.toLowerCase())) {
            weatherScore += 5;
          }
        }
        // Cool Weather (<= 18°C)
        else if (temp <= 18) {
          if (cat === "Outerwear" || sub.includes("jacket") || sub.includes("blazer") || sub.includes("coat")) {
            weatherScore += 15;
          }
          if (sub.includes("sweater") || sub.includes("knit") || sub.includes("trousers")) {
            weatherScore += 10;
          }
        }

        // Rainy conditions
        if (isRainy) {
          if (sub.includes("suede") || sub.includes("canvas")) {
            weatherScore -= 15;
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
        colorScore += 15;
      } else if (COLOR_HARMONIES[color1]?.includes(color2)) {
        colorScore += 25;
      }
    }
    const colorCompatibility = Math.min(100, colorScore);

    // 5. Recent Wear Balance (10% weight)
    let wearScore = 80;
    const now = new Date().getTime();
    items.forEach((item) => {
      if (item.lastWorn) {
        const diffDays = Math.floor((now - new Date(item.lastWorn).getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0) wearScore -= 20;
        else if (diffDays >= 7) wearScore += 10;
      } else {
        wearScore += 15;
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
            `You prefer oversized fits, so I kept that preference while selecting your lighter, breathable pieces for today's **${weather.temperature}°C** weather.`
          );
        } else {
          reasons.push(
            `Comfortably balanced for today's **${weather.temperature}°C • ${weather.condition}** weather with breathable pieces.`
          );
        }
      } else if (weather.temperature <= 18) {
        reasons.push(
          `Layered with structural warmth suited for **${weather.temperature}°C** cooler conditions.`
        );
      } else if (weather.condition === "Rainy" || weather.precipitation.toLowerCase().includes("rain")) {
        reasons.push(
          `Rain-conscious selection ensuring comfort and weather protection.`
        );
      } else {
        reasons.push(
          `Fabric weight calibrated for today's **${weather.temperature}°C** temperature.`
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

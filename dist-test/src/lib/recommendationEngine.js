import { generateId } from "./utils";
// Color harmony pairings for intelligent matching
const COLOR_HARMONIES = {
    black: ["white", "grey", "beige", "olive", "burgundy", "charcoal", "tan", "black", "navy"],
    white: ["black", "navy", "grey", "beige", "olive", "blue", "burgundy", "tan", "charcoal"],
    navy: ["white", "beige", "grey", "tan", "brown", "khaki", "burgundy", "navy"],
    grey: ["black", "white", "navy", "burgundy", "blue", "pink", "charcoal"],
    beige: ["black", "navy", "white", "brown", "olive", "charcoal", "burgundy"],
    olive: ["white", "black", "beige", "tan", "grey", "navy"],
    brown: ["beige", "white", "navy", "cream", "tan", "blue"],
    burgundy: ["black", "grey", "white", "navy", "beige"],
};
export class RecommendationEngine {
    static generateRecommendation(wardrobe, profile, request) {
        const targetOccasion = request.occasion.toLowerCase();
        const excludeIds = new Set(request.excludeItemIds || []);
        // Filter available items
        const availableItems = wardrobe.filter((i) => !excludeIds.has(i.id));
        // Group by category
        const tops = availableItems.filter((i) => i.category === "Tops");
        const bottoms = availableItems.filter((i) => i.category === "Bottoms");
        const dresses = availableItems.filter((i) => i.category === "Dresses");
        const shoes = availableItems.filter((i) => i.category === "Shoes");
        const outerwear = availableItems.filter((i) => i.category === "Outerwear");
        const accessories = availableItems.filter((i) => i.category === "Accessories");
        const candidateCombinations = [];
        // Form 2-piece and 3/4-piece candidate sets (Top + Bottom + Shoes + optional Outerwear/Accessory)
        if (tops.length > 0 && bottoms.length > 0 && shoes.length > 0) {
            for (const top of tops) {
                for (const bottom of bottoms) {
                    for (const shoe of shoes) {
                        const combo = [top, bottom, shoe];
                        // Optionally add complementary outerwear if suitable for occasion
                        const matchingOuterwear = outerwear.find((o) => o.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion)) ||
                            (top.color === "White" && o.color === "Black"));
                        if (matchingOuterwear && Math.random() > 0.5) {
                            combo.push(matchingOuterwear);
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
                    const combo = [dress, shoe];
                    const matchingOuterwear = outerwear[0];
                    if (matchingOuterwear)
                        combo.push(matchingOuterwear);
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
        const scoredCandidates = candidateCombinations.map((combo) => {
            const breakdown = this.calculateBreakdown(combo.items, profile, request);
            const rationale = this.generateRationale(combo.items, breakdown, request, profile);
            const stylingTips = this.generateStylingTips(combo.items, request);
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
        const explanation = `OP AI curated this look specifically for your **${request.occasion}** occasion. It harmonizes your preferred style aesthetics (${profile.stylePreferences.slice(0, 2).join(", ")}) while maintaining optimal wardrobe rotation for items not worn recently.`;
        return {
            primary,
            alternatives,
            source: "deterministic_engine",
            explanation,
            generatedAt: new Date().toISOString(),
        };
    }
    static calculateBreakdown(items, profile, request) {
        const targetOccasion = request.occasion.toLowerCase();
        // 1. Occasion Fit (30% weight)
        let occasionMatches = 0;
        items.forEach((item) => {
            const match = item.occasion.some((occ) => occ.toLowerCase().includes(targetOccasion) ||
                targetOccasion.includes(occ.toLowerCase()) ||
                occ.toLowerCase() === "everyday" ||
                occ.toLowerCase() === "casual");
            if (match)
                occasionMatches++;
        });
        const occasionFit = Math.min(100, Math.round((occasionMatches / items.length) * 100 + 15));
        // 2. Preference Match (25% weight)
        let prefScore = 60;
        const userColors = (profile.colorPreferences || []).map((c) => c.toLowerCase());
        const userFits = (profile.fitPreferences || []).map((f) => f.toLowerCase());
        if (profile.fitPreference && profile.fitPreference !== "Not Specified") {
            userFits.push(profile.fitPreference.toLowerCase());
        }
        items.forEach((item) => {
            if (userColors.includes(item.color.toLowerCase()))
                prefScore += 8;
            if (item.fit && userFits.includes(item.fit.toLowerCase()))
                prefScore += 6;
            if (item.favorite)
                prefScore += 6;
        });
        const preferenceMatch = Math.min(100, prefScore);
        // 3. Color Compatibility (20% weight)
        let colorScore = 70;
        if (items.length >= 2) {
            const color1 = items[0].color.toLowerCase();
            const color2 = items[1].color.toLowerCase();
            if (color1 === color2) {
                colorScore += 15; // Monochrome harmony
            }
            else if (COLOR_HARMONIES[color1]?.includes(color2)) {
                colorScore += 25; // Complementary pairing
            }
        }
        const colorCompatibility = Math.min(100, colorScore);
        // 4. Recent Wear Balance (15% weight)
        // Rewards items not worn in past 7 days, avoids over-worn pieces
        let wearScore = 80;
        const now = new Date().getTime();
        items.forEach((item) => {
            if (item.lastWorn) {
                const diffDays = Math.floor((now - new Date(item.lastWorn).getTime()) / (1000 * 3600 * 24));
                if (diffDays === 0)
                    wearScore -= 20; // worn today
                else if (diffDays >= 7)
                    wearScore += 10; // good rotation
            }
            else {
                wearScore += 15; // fresh unworn piece
            }
        });
        const recentWearBalance = Math.min(100, Math.max(30, wearScore));
        // 5. Wardrobe Availability & Completeness (10% weight)
        const hasTop = items.some((i) => i.category === "Tops" || i.category === "Dresses");
        const hasBottom = items.some((i) => i.category === "Bottoms" || i.category === "Dresses");
        const hasShoes = items.some((i) => i.category === "Shoes");
        const wardrobeAvailability = hasTop && hasBottom && hasShoes ? 100 : 70;
        // Weighted Total Score (0-100)
        const totalScore = Math.round(occasionFit * 0.3 +
            preferenceMatch * 0.25 +
            colorCompatibility * 0.2 +
            recentWearBalance * 0.15 +
            wardrobeAvailability * 0.1);
        return {
            occasionFit,
            preferenceMatch,
            colorCompatibility,
            recentWearBalance,
            wardrobeAvailability,
            totalScore,
        };
    }
    static generateRationale(items, breakdown, request, profile) {
        const reasons = [];
        // Style match rationale
        if (profile.stylePreferences.length > 0) {
            reasons.push(`Aligned with your **${profile.stylePreferences[0]}** aesthetic.`);
        }
        // Occasion rationale
        reasons.push(`Constructed specifically for **${request.occasion}** environments.`);
        // Color harmony rationale
        const itemColors = Array.from(new Set(items.map((i) => i.color)));
        if (itemColors.length > 1) {
            reasons.push(`Balanced palette featuring **${itemColors.slice(0, 2).join(" and ")}** tones.`);
        }
        // Rotation rationale
        const freshItems = items.filter((i) => !i.lastWorn || i.wearCount < 6);
        if (freshItems.length > 0) {
            reasons.push(`Brings ${freshItems[0].name} into active rotation.`);
        }
        else {
            reasons.push("Balances wear distribution across your core wardrobe pieces.");
        }
        return reasons;
    }
    static generateStylingTips(items, request) {
        const tips = [];
        const hasOvershirt = items.some((i) => i.subcategory.toLowerCase().includes("overshirt"));
        const hasSneakers = items.some((i) => i.subcategory.toLowerCase().includes("sneaker"));
        const hasOxford = items.some((i) => i.subcategory.toLowerCase().includes("button-up"));
        if (hasOvershirt) {
            tips.push("Leave the overshirt unbuttoned for an effortless layered drape.");
        }
        if (hasOxford) {
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
    static inferVibe(items, occasion) {
        const categories = items.map((i) => i.category);
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

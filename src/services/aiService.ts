import { WardrobeCategory, Season } from "@/types/wardrobe";
import { UserProfile } from "@/types/user";
import { ControlledColor } from "@/lib/colorVocabulary";
import { fashionAnalysisService } from "./fashionAnalysisService";
import { FashionAnalysisResult } from "@/lib/fashion/FashionModelProvider";

export interface AIAnalysisResult {
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  itemType: string;
  color: ControlledColor;
  secondaryColors?: ControlledColor[];
  pattern?: string;
  style: string;
  occasion: string[];
  season: Season[];
  fit: string;
  size: string;
  material?: string;
  brand?: string;
  confidence: "high" | "medium" | "low" | any;
  model: {
    provider: string;
    model: string;
    version: string;
    device?: string;
  };
  aiSummary: string;
}

export const aiService = {
  /**
   * Analyze clothing image using FashionCLIP (EMaghakyan/fashion-clip)
   * Dispatches to dedicated Fashion Analysis Service and maps zero-shot classification results.
   */
  analyzeClothingImage: async (
    imageInput: string,
    userProfile?: UserProfile | null,
    manualContextText?: string
  ): Promise<AIAnalysisResult> => {
    // Artificial latency (400ms) for UI feedback transitions
    await new Promise((resolve) => setTimeout(resolve, 400));

    const analysis: FashionAnalysisResult = await fashionAnalysisService.analyzeImage(
      imageInput,
      userProfile,
      manualContextText
    );

    // Determine confidence level
    const avgConf =
      (analysis.confidence.category +
        analysis.confidence.color +
        analysis.confidence.pattern +
        analysis.confidence.style) /
      4;
    const confidenceTier = avgConf >= 0.85 ? "high" : avgConf >= 0.6 ? "medium" : "low";

    return {
      name: analysis.name,
      category: analysis.category,
      subcategory: analysis.subcategory,
      itemType: analysis.itemType,
      color: analysis.primaryColor,
      secondaryColors: analysis.secondaryColors,
      pattern: analysis.pattern,
      style: analysis.style,
      occasion: analysis.occasion,
      season: analysis.season,
      fit: analysis.fit,
      size: analysis.size,
      material: analysis.material,
      brand: analysis.brand,
      confidence: confidenceTier,
      model: analysis.model,
      aiSummary: analysis.aiSummary,
    };
  },

  /**
   * Parse natural language style statements into structured profile preferences
   */
  parseNaturalLanguagePreferences: (input: string): {
    preferredColors: string[];
    preferredStyles: string[];
    fitPreference: string;
    preferredOccasions: string[];
  } => {
    const text = input.toLowerCase();

    const colors: string[] = [];
    if (text.includes("black")) colors.push("Black");
    if (text.includes("white")) colors.push("White");
    if (text.includes("navy")) colors.push("Navy");
    if (text.includes("grey") || text.includes("gray")) colors.push("Grey");
    if (text.includes("beige") || text.includes("tan")) colors.push("Beige");
    if (text.includes("blue")) colors.push("Blue");
    if (text.includes("red") || text.includes("crimson")) colors.push("Red");
    if (text.includes("olive")) colors.push("Olive");
    if (text.includes("green")) colors.push("Green");
    if (text.includes("brown")) colors.push("Brown");
    if (text.includes("pink")) colors.push("Pink");
    if (text.includes("purple")) colors.push("Purple");

    const styles: string[] = [];
    if (text.includes("minimal")) styles.push("Minimalist");
    if (text.includes("casual")) styles.push("Casual");
    if (text.includes("tailored") || text.includes("formal") || text.includes("smart"))
      styles.push("Tailored Classic");
    if (text.includes("streetwear")) styles.push("Streetwear");
    if (text.includes("quiet luxury") || text.includes("luxury")) styles.push("Quiet Luxury");

    let fit = "Regular";
    if (text.includes("oversized")) fit = "Oversized";
    else if (text.includes("slim")) fit = "Slim";
    else if (text.includes("relaxed") || text.includes("loose")) fit = "Relaxed";

    const occasions: string[] = [];
    if (text.includes("office") || text.includes("work")) occasions.push("Office");
    if (text.includes("meeting")) occasions.push("Meeting");
    if (text.includes("casual") || text.includes("everyday")) occasions.push("Everyday");
    if (text.includes("party") || text.includes("night") || text.includes("dinner")) occasions.push("Dinner");

    return {
      preferredColors: colors.length > 0 ? colors : ["Black", "Grey", "Navy"],
      preferredStyles: styles.length > 0 ? styles : ["Minimalist", "Casual"],
      fitPreference: fit,
      preferredOccasions: occasions.length > 0 ? occasions : ["Office", "Everyday", "Dinner"],
    };
  },
};

import { WardrobeCategory, Season } from "@/types/wardrobe";
import { ControlledColor } from "@/lib/colorVocabulary";

export interface FashionConfidenceScores {
  category: number;
  color: number;
  pattern: number;
  style: number;
}

export interface FashionModelMetadata {
  provider: "FashionCLIP" | "MMFashion" | "HybridVision" | string;
  model: string;
  version: string;
  device?: string;
}

export interface FashionAnalysisResult {
  success: boolean;
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  itemType: string;
  primaryColor: ControlledColor;
  secondaryColors?: ControlledColor[];
  pattern: string;
  fit: string;
  style: string;
  occasion: string[];
  season: Season[];
  material?: string;
  brand?: string;
  size: string;
  confidence: FashionConfidenceScores;
  model: FashionModelMetadata;
  aiSummary: string;
}

export interface FashionAnalysisInput {
  image: string; // Base64 data URL or URL
  contextHint?: string;
  userProfileSize?: string;
}

export interface FashionModelProvider {
  name: string;
  analyzeImage(input: FashionAnalysisInput): Promise<FashionAnalysisResult>;
  checkHealth?(): Promise<{ status: string; isReady: boolean }>;
}

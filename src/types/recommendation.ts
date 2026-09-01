import { WardrobeItem } from "./wardrobe";
import { UserProfile } from "./user";
import { WeatherContext } from "./weather";

export interface RecommendationRequest {
  occasion: string;
  date?: string;
  notes?: string;
  preferredStyle?: string;
  preferredColor?: string;
  excludeItemIds?: string[];
  weather?: WeatherContext;
}

export interface RecommendationScoreBreakdown {
  occasionFit: number; // 0-100 (25% weight)
  preferenceMatch: number; // 0-100 (20% weight)
  weatherCompatibility: number; // 0-100 (20% weight)
  colorCompatibility: number; // 0-100 (15% weight)
  recentWearBalance: number; // 0-100 (10% weight)
  wardrobeAvailability: number; // 0-100 (10% weight)
  totalScore: number; // 0-100 weighted
}

export interface RecommendationCandidate {
  id: string;
  name: string;
  items: WardrobeItem[];
  score: number;
  breakdown: RecommendationScoreBreakdown;
  rationale: string[];
  stylingTips: string[];
  vibe: string;
  occasionMatch: string;
  weatherNote?: string;
}

export interface RecommendationResponse {
  primary: RecommendationCandidate;
  alternatives: RecommendationCandidate[];
  source: "gemini_ai" | "deterministic_engine";
  explanation: string;
  weather?: WeatherContext;
  generatedAt: string;
}

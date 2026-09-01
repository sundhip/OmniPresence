import {
  RecommendationRequest,
  RecommendationResponse,
} from "@/types/recommendation";
import { wardrobeService } from "./wardrobeService";
import { profileService } from "./profileService";
import { weatherService } from "./weatherService";
import { RecommendationEngine } from "@/lib/recommendationEngine";

export const recommendationService = {
  // Get outfit recommendations from OP AI with weather context integration
  getOutfitRecommendation: async (
    request: RecommendationRequest
  ): Promise<RecommendationResponse> => {
    const wardrobe = await wardrobeService.getItems();
    const profile = await profileService.getProfile();

    if (wardrobe.length === 0) {
      throw new Error("Your wardrobe is empty. Please add items first.");
    }

    // Retrieve weather context if not already provided
    let weather = request.weather;
    if (!weather) {
      try {
        weather = await weatherService.getWeatherContext();
      } catch (e) {
        console.warn("Could not retrieve weather context for recommendation:", e);
      }
    }

    const enhancedRequest: RecommendationRequest = {
      ...request,
      weather,
    };

    try {
      // Attempt to invoke the API endpoint
      const res = await fetch("/api/v1/recommendations/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...enhancedRequest,
          wardrobe,
          profile,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.primary) {
          return data;
        }
      }
    } catch (e) {
      console.warn("OP AI API unavailable, engaging local deterministic recommendation engine:", e);
    }

    // Deterministic fallback engine
    return RecommendationEngine.generateRecommendation(wardrobe, profile, enhancedRequest);
  },
};

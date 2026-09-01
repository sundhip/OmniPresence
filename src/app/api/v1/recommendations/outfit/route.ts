import { NextResponse } from "next/server";
import { RecommendationEngine } from "@/lib/recommendationEngine";
import { WardrobeItem } from "@/types/wardrobe";
import { UserProfile } from "@/types/user";
import { RecommendationRequest } from "@/types/recommendation";
import { WeatherContext } from "@/types/weather";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occasion, date, notes, preferredStyle, preferredColor, weather, wardrobe, profile } = body;

    if (!occasion) {
      return NextResponse.json({ error: "Occasion is required" }, { status: 400 });
    }

    const wardrobeItems: WardrobeItem[] = wardrobe || [];
    const userProfile: UserProfile = profile;
    const weatherContext: WeatherContext | undefined = weather;

    if (wardrobeItems.length === 0) {
      return NextResponse.json({ error: "Wardrobe contains no items" }, { status: 400 });
    }

    const request: RecommendationRequest = {
      occasion,
      date,
      notes,
      preferredStyle,
      preferredColor,
      weather: weatherContext,
    };

    const recommendation = RecommendationEngine.generateRecommendation(
      wardrobeItems,
      userProfile,
      request
    );

    return NextResponse.json(recommendation);
  } catch (error: any) {
    console.error("API error in recommendation endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}

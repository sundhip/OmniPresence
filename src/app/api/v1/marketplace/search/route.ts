import { NextRequest, NextResponse } from "next/server";
import { parseFashionSearchQuery } from "@/lib/fashionSearchParser";
import { marketplaceAggregator } from "@/lib/marketplace/MarketplaceAggregator";
import { MarketplaceSearchFilters } from "@/types/marketplace";
import { profileService } from "@/services/profileService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query: rawQuery = "",
      filters = {} as MarketplaceSearchFilters,
      userId,
      context,
    } = body;

    // Fetch user profile for personalized "Best For You" ranking and default gender
    let userProfile = null;
    if (userId) {
      try {
        userProfile = await profileService.getProfile(userId);
      } catch (e) {
        console.warn("[MarketplaceRoute] Profile fetch note:", e);
      }
    }

    // Parse natural language shopping query
    const parsedQuery = parseFashionSearchQuery(
      rawQuery || "Dress",
      filters.gender || userProfile?.gender
    );

    // Aggregate, validate, deduplicate, and rank marketplace products
    const response = await marketplaceAggregator.searchAndRank(
      parsedQuery,
      filters,
      userProfile,
      userId,
      context
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("[MarketplaceRoute] Search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute marketplace search",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "Dress";
    const category = searchParams.get("category");
    const style = searchParams.get("style");
    const color = searchParams.get("color");
    const gender = searchParams.get("gender") as "Women" | "Men" | "All" | null;
    const maxPrice = searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined;

    const parsed = parseFashionSearchQuery(query, gender || undefined);
    if (category) parsed.category = category;
    if (style) parsed.style = style;
    if (color) parsed.color = color;
    if (maxPrice) parsed.budget = { max: maxPrice };

    const filters: MarketplaceSearchFilters = {
      gender: gender || undefined,
      maxPrice,
    };

    const response = await marketplaceAggregator.searchAndRank(parsed, filters);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

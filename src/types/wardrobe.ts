export type WardrobeCategory =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Shoes"
  | "Accessories";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter" | "All-Season";

export interface WearEvent {
  id: string;
  wardrobeItemId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  occasion: string;
  notes?: string;
  outfitId?: string;
  createdAt: string;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  color: string;
  secondaryColors?: string[];
  brand?: string;
  size?: string;
  fit?: string;
  material?: string;
  season: Season[];
  occasion: string[];
  imageUrl: string;
  wearCount: number;
  lastWorn?: string | null; // ISO date string
  favorite?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WardrobeFilterOptions {
  category?: WardrobeCategory | "All";
  searchQuery?: string;
  colors?: string[];
  seasons?: Season[];
  occasions?: string[];
  brands?: string[];
  favoriteOnly?: boolean;
  wearFrequency?: "all" | "never" | "low" | "medium" | "high";
  sortBy?: "recentlyAdded" | "recentlyWorn" | "mostWorn" | "leastWorn" | "nameAsc" | "nameDesc";
}

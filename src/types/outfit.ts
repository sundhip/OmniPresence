import { WardrobeItem } from "./wardrobe";

export interface OutfitItemSelection {
  topId?: string;
  bottomId?: string;
  dressId?: string;
  shoesId?: string;
  outerwearId?: string;
  accessoryIds?: string[];
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  items: string[]; // List of WardrobeItem IDs
  occasion: string;
  date?: string | null; // Scheduled or planned date (YYYY-MM-DD)
  notes?: string;
  favorite?: boolean;
  wearCount?: number;
  lastWorn?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedOutfit extends Omit<Outfit, "items"> {
  items: WardrobeItem[];
}

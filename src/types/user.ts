export type StylePreference =
  | "Casual"
  | "Smart Casual"
  | "Formal"
  | "Minimal"
  | "Streetwear"
  | "Sporty"
  | "Traditional"
  | "Vintage"
  | "Bohemian"
  | "Business Casual"
  | "Trendy"
  | "Elegant"
  | "Experimental"
  | "Let OP AI Learn";

export type ColorPreference =
  | "Black"
  | "White"
  | "Navy"
  | "Grey"
  | "Beige"
  | "Earth Tones"
  | "Pastel"
  | "Bright"
  | "Monochrome"
  | "Olive"
  | "Brown"
  | "Red"
  | "Burgundy"
  | "Pink"
  | "Cyan"
  | "Blue"
  | "Tan";

export type OccasionType =
  | "College"
  | "Office"
  | "Meeting"
  | "Date"
  | "Travel"
  | "Party"
  | "Workout"
  | "Everyday"
  | "Dinner"
  | "Formal Event"
  | "Weekend Casual"
  | "Business / Meetings"
  | "Casual Outings"
  | "Weddings / Functions"
  | "Festivals"
  | "Gym / Sports"
  | "Everyday Wear"
  | "Other";

export type FitPreference = "Slim" | "Regular" | "Relaxed" | "Oversized" | "Tailored" | "Not Specified";

export interface UserSizes {
  tops: string;
  bottoms: string;
  shoes: string;
  outerwear?: string;
}

export interface NotificationSettings {
  dailyOutfitSuggestions: boolean;
  wearBalancingAlerts: boolean;
  weatherUpdates: boolean;
  eventReminders: boolean;
}

export interface ConnectedServices {
  weather: boolean;
  calendar: boolean;
  financialSync: boolean;
}

// ==========================================
// APPEARANCE & SMART PERSONALIZATION TYPES
// ==========================================

export type AttributeSource = "AI" | "User" | "AI_Confirmed" | "Manual";

export interface SkinTonePaletteItem {
  id: string;
  hex: string;
  name: string;
  undertone: "Warm" | "Cool" | "Neutral";
  description: string;
}

export const SKIN_TONE_PALETTE: SkinTonePaletteItem[] = [
  { id: "st-1", hex: "#F7ECE1", name: "Fair Porcelain", undertone: "Cool", description: "Light ivory with cool pink/rosy undertones" },
  { id: "st-2", hex: "#F3DFD1", name: "Fair Warm", undertone: "Warm", description: "Fair cream with subtle peach/golden warmth" },
  { id: "st-3", hex: "#E7C7A9", name: "Light Beige", undertone: "Neutral", description: "Light balanced beige with neutral undertones" },
  { id: "st-4", hex: "#DCB38D", name: "Medium Golden", undertone: "Warm", description: "Golden wheat with radiant warm undertones" },
  { id: "st-5", hex: "#C89E73", name: "Medium Olive", undertone: "Neutral", description: "Warm olive/tan with balanced undertones" },
  { id: "st-6", hex: "#B58252", name: "Tan Honey", undertone: "Warm", description: "Honey bronze with rich golden warmth" },
  { id: "st-7", hex: "#9C6A3B", name: "Rich Caramel", undertone: "Warm", description: "Deep caramel with rich warm undertones" },
  { id: "st-8", hex: "#814F26", name: "Deep Chestnut", undertone: "Cool", description: "Rich chestnut with cool espresso undertones" },
  { id: "st-9", hex: "#5C3517", name: "Espresso Bronze", undertone: "Neutral", description: "Deep bronze with balanced undertones" },
  { id: "st-10", hex: "#381E0C", name: "Deep Obsidian", undertone: "Cool", description: "Deep rich obsidian with cool undertones" },
];

export interface SkinToneInfo {
  paletteId: string;
  hex: string;
  name: string;
  undertone: "Warm" | "Cool" | "Neutral";
  source: AttributeSource;
  confidence?: number;
}

export type HairColour =
  | "Black"
  | "Dark Brown"
  | "Brown"
  | "Light Brown"
  | "Blonde"
  | "Auburn / Red"
  | "Grey / White"
  | "Dyed / Multiple Colours"
  | "Other";

export type HairTexture =
  | "Straight"
  | "Wavy"
  | "Curly"
  | "Coily"
  | "Very Curly / Tight Curls"
  | "Not Sure";

export type HairLength =
  | "Very Short"
  | "Short"
  | "Medium"
  | "Shoulder Length"
  | "Long"
  | "Very Long"
  | "Not Sure";

export type CurrentHairstyle =
  | "Short Crop"
  | "Bob"
  | "Layered"
  | "Long & Open"
  | "Ponytail"
  | "Bun"
  | "Braids"
  | "Fade / Taper"
  | "Undercut"
  | "Curly / Natural"
  | "Other"
  | "I change hairstyles often";

export type FaceShape =
  | "Oval"
  | "Round"
  | "Square"
  | "Heart"
  | "Diamond"
  | "Oblong / Long"
  | "Not Sure";

export interface HairProfile {
  color: HairColour;
  texture: HairTexture;
  length: HairLength;
  currentStyle: CurrentHairstyle;
  source: AttributeSource;
  confidence?: {
    color?: number;
    texture?: number;
    length?: number;
    style?: number;
  };
}

export interface FaceShapeInfo {
  shape: FaceShape;
  source: AttributeSource;
  confidence?: number;
}

export interface AppearanceProfile {
  skinTone?: SkinToneInfo;
  hair?: HairProfile;
  faceShape?: FaceShapeInfo;
  photoUrl?: string;
  analyzedAt?: string;
  isAiAnalyzed?: boolean;
}

export type OutfitPriority =
  | "Comfort"
  | "Appearance"
  | "Colours that suit me"
  | "Latest Trends"
  | "Budget"
  | "Quality"
  | "Brand"
  | "Durability"
  | "Easy Maintenance"
  | "Professional Appearance"
  | "Traditional Appearance"
  | "Unique / Stand-out Style";

export type ShoppingPriority =
  | "Lowest Price"
  | "Best Value for Money"
  | "Best Quality"
  | "Highest Rated"
  | "Most Popular"
  | "Most Sold"
  | "Fastest Delivery"
  | "Trusted Brand"
  | "Trending"
  | "Discounts / Offers";

export type ReminderTopic =
  | "Outfit Planning"
  | "Event Preparation"
  | "Grooming / Hairstyle"
  | "Wardrobe Maintenance"
  | "Laundry"
  | "Shopping / Budget"
  | "Upcoming Events"
  | "Travel"
  | "Weather-Based Reminders"
  | "No Reminders";

export type ReminderProactivity =
  | "Important Reminders Only"
  | "Helpful Suggestions"
  | "Proactive Suggestions"
  | "Let OP AI Decide";

export interface ShoppingPreferences {
  priorities: ShoppingPriority[];
}

export interface ReminderPreferences {
  topics: ReminderTopic[];
  proactivity: ReminderProactivity;
}

export type GenderPreference = "Women" | "Men" | "Unisex" | "All";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  gender?: GenderPreference;
  bio?: string;
  stylePreferences: StylePreference[];
  colorPreferences: ColorPreference[];
  occasionPreferences: OccasionType[];
  fitPreferences?: FitPreference[];
  fitPreference?: FitPreference;
  sizes: UserSizes;
  preferredBrands: string[];
  notificationSettings: NotificationSettings;
  connectedServices: ConnectedServices;
  theme: "light" | "dark" | "system";
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;

  // Smart Personalization & Appearance
  appearance?: AppearanceProfile;
  desiredHairstyles?: string[];
  outfitPriorities?: OutfitPriority[];
  shoppingPreferences?: ShoppingPreferences;
  reminderPreferences?: ReminderPreferences;
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

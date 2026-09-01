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
  | "Business Casual";

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
  | "Weekend Casual";

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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
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
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

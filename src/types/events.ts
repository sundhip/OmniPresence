export type EventCategory =
  | "Presentation"
  | "Wedding"
  | "Job Interview"
  | "Work Meeting"
  | "Casual Outing"
  | "Date"
  | "Formal Gala"
  | "Party"
  | "Travel"
  | "Workout"
  | "Conference"
  | "Dinner"
  | "Other";

export type EventPriority = "High" | "Medium" | "Low";

export type TransitMode =
  | "Train"
  | "Metro"
  | "Bus"
  | "Cab"
  | "Auto"
  | "Car"
  | "Walking";

export interface TransitOption {
  mode: TransitMode;
  name: string;
  durationMinutes: number;
  departureTime: string;
  estimatedCost: string;
  carbonFootprint: "Low" | "Medium" | "High";
  reliability: "High" | "Medium" | "Low";
  routeDescription: string;
  isFastest?: boolean;
  isCheapest?: boolean;
  isEco?: boolean;
}

export interface TransportationPlan {
  origin: string;
  destination: string;
  eventTime: string;
  recommendedDepartureTime: string;
  recommendedOption: TransitOption;
  allOptions: TransitOption[];
  bufferMinutes: number;
  distanceKm?: number;
}

export interface InferredEventContext {
  occasion: string;
  formality: "Formal" | "Semi-Formal" | "Smart Casual" | "Casual" | "Festive" | "Traditional";
  priority: EventPriority;
  recommendedDressCode: string;
  recommendedColorPalette: string[];
  weatherSuitabilityNote?: string;
  preparationTimeline: {
    timeBeforeMin: number;
    task: string;
    type: "outfit" | "iron" | "accessories" | "grooming" | "pack" | "transit" | "departure";
    defaultReminder: boolean;
  }[];
  travelRequirement: {
    estimatedDurationMinutes: number;
    recommendedTransit: TransitMode;
    bufferMinutes: number;
  };
}

export type ReadinessStatus = "READY" | "ALMOST READY" | "NEEDS PREPARATION";

export interface ReadinessFactor {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  actionPrompt?: string;
}

export interface EventReadiness {
  score: number; // 0 - 100%
  status: ReadinessStatus;
  summary: string;
  factors: ReadinessFactor[];
  missingItems: string[];
  nextAction?: string;
}

export interface PlannedOutfitDetails {
  outfitId?: string;
  topItemId?: string;
  topItemName?: string;
  bottomItemId?: string;
  bottomItemName?: string;
  shoesItemId?: string;
  shoesItemName?: string;
  outerwearItemId?: string;
  outerwearItemName?: string;
  accessoryIds?: string[];
  accessoryNames?: string[];
  notes?: string;
}

export interface EventItem {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hr or 12-hr display)
  endTime?: string;
  location: string;
  originLocation?: string;
  type: EventCategory;
  priority: EventPriority;
  notes?: string;
  dressCode?: string;
  plannedOutfit?: PlannedOutfitDetails;
  selectedTransitMode?: TransitMode;
  completedChecklist?: string[];
  createdAt: string;
  updatedAt: string;
}

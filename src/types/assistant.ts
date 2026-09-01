import { EventItem } from "./events";
import { WardrobeItem } from "./wardrobe";
import { WeatherContext } from "./weather";
import { FinancialPlan, TransactionCategory } from "./finance";
import { ReminderItem, ReminderType } from "./reminders";
import { UserProfile } from "./user";

export type AssistantIntentType =
  // Layer 1: General Intelligence
  | "general_knowledge"
  | "general_writing"
  | "general_coding"
  | "general_reasoning"
  | "general_translation"
  | "general_summarization"
  | "general_brainstorming"
  // Layer 2: OmniPresence Domain Assistance
  | "fashion_general"
  | "outfit_recommendation"
  | "calendar_schedule"
  | "transit_departure"
  | "readiness_checklist"
  | "financial_inquiry"
  | "personal_management"
  | "weather_query"
  // Layer 3: Multi-Domain Cross-Intelligence
  | "multi_domain"
  // Layer 4: Application Actions
  | "action_create_transaction"
  | "action_create_reminder"
  | "action_create_event"
  | "action_mark_worn"
  | "general_chat";

export interface PendingAction {
  id: string;
  type: "create_transaction" | "create_reminder" | "create_event" | "mark_worn";
  title: string;
  description: string;
  status: "pending" | "confirmed" | "cancelled" | "executed";
  payload: {
    // Transaction payload
    amount?: number;
    category?: TransactionCategory;
    txTitle?: string;
    // Reminder payload
    reminderTitle?: string;
    reminderTime?: string;
    reminderDate?: string;
    reminderType?: ReminderType;
    // Event payload
    eventTitle?: string;
    eventDate?: string;
    eventTime?: string;
    eventLocation?: string;
    // Wardrobe payload
    itemId?: string;
    itemName?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  intent?: AssistantIntentType;
  suggestedActions?: {
    label: string;
    actionType: "navigate" | "query" | "outfit_recommendation" | "view_event";
    payload?: string;
  }[];
  pendingAction?: PendingAction;
  dataContext?: {
    eventId?: string;
    eventTitle?: string;
    outfitSummary?: string;
    weatherSummary?: string;
    transitSummary?: string;
    readinessScore?: number;
    financialSummary?: string;
  };
  embeddedCard?: {
    type: "outfit" | "event" | "finance" | "weather" | "action_confirmation" | "code_block" | "multi_domain";
    title: string;
    subtitle?: string;
    details: Record<string, any>;
  };
}

export interface AssistantQueryContext {
  userId?: string;
  user: UserProfile | null;
  events: EventItem[];
  wardrobe: WardrobeItem[];
  weather: WeatherContext | null;
  financialPlan: FinancialPlan | null;
  reminders: ReminderItem[];
  recentMessages?: { sender: "user" | "assistant"; text: string }[];
}

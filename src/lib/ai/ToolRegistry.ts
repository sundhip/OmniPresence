import { OPTools } from "./OPTools";
import { weatherService } from "@/services/weatherService";
import { marketplaceService } from "@/services/marketplaceService";
import { TransactionCategory } from "@/types/finance";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  isWriteAction?: boolean;
  requiresConfirmation?: boolean;
}

export const ALLOWLISTED_TOOLS: ToolDefinition[] = [
  // WARDROBE
  {
    name: "get_wardrobe",
    description: "Retrieve digital wardrobe clothing items for the authenticated user",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional clothing category (e.g. Tops, Bottoms, Dresses, Shoes)" },
        color: { type: "string", description: "Optional color filter (e.g. Red, Black, Blue)" },
      },
    },
  },
  {
    name: "get_wear_history",
    description: "Retrieve wear history logs and frequency for wardrobe pieces",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Optional item ID to filter history" },
      },
    },
  },
  {
    name: "mark_item_worn",
    description: "Mark a wardrobe item as worn today",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Wardrobe item ID" },
      },
      required: ["itemId"],
    },
    isWriteAction: true,
  },

  // CALENDAR & TRANSIT
  {
    name: "get_upcoming_events",
    description: "Get upcoming schedule, meetings, presentations, and events",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_calendar_event",
    description: "Schedule a new event in the user's personal timeline",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        date: { type: "string", description: "Event date in YYYY-MM-DD format" },
        time: { type: "string", description: "Event start time in HH:MM format" },
        location: { type: "string", description: "Venue or location name" },
      },
      required: ["title", "date", "time"],
    },
    isWriteAction: true,
    requiresConfirmation: true,
  },

  // FINANCE
  {
    name: "get_financial_summary",
    description: "Retrieve monthly financial budget, spent amount, savings target, and remaining balance",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_transaction",
    description: "Record a financial expense under Food, Gaming, Stationery, Fashion, Transit, Bills, or Other",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Description of expense" },
        amount: { type: "number", description: "Amount in INR (₹)" },
        category: { type: "string", description: "Expense category" },
      },
      required: ["title", "amount", "category"],
    },
    isWriteAction: true,
    requiresConfirmation: true,
  },

  // WEATHER
  {
    name: "get_weather_context",
    description: "Fetch live local weather conditions, temperature, and rain probability",
    parameters: { type: "object", properties: {} },
  },

  // MANAGEMENT & REMINDERS
  {
    name: "get_reminders",
    description: "Fetch user reminders and preparation checklists",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "create_reminder",
    description: "Create a timely reminder for events, styling, or daily tasks",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Reminder description" },
        time: { type: "string", description: "Time in HH:MM format" },
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
      },
      required: ["title"],
    },
    isWriteAction: true,
    requiresConfirmation: true,
  },

  // MARKETPLACE
  {
    name: "search_marketplace",
    description: "Search live shopping products across Amazon and Flipkart",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product search keywords" },
        maxPrice: { type: "number", description: "Optional maximum price filter" },
      },
      required: ["query"],
    },
  },
];

export class ToolRegistry {
  public static getAllowlistedTools(): ToolDefinition[] {
    return ALLOWLISTED_TOOLS;
  }

  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string
  ): Promise<any> {
    if (!userId) throw new Error("Unauthorized: userId is strictly required for tool execution.");

    switch (toolName) {
      case "get_wardrobe":
        return OPTools.getWardrobe(userId, args.category, args.color);
      case "get_wear_history":
        return OPTools.getWearHistory(userId, args.itemId);
      case "mark_item_worn":
        return OPTools.markItemWorn(userId, args.itemId);
      case "get_upcoming_events":
        return OPTools.getUpcomingEvents(userId);
      case "create_calendar_event":
        return OPTools.createCalendarEvent(userId, {
          title: args.title,
          date: args.date,
          time: args.time,
          location: args.location,
        });
      case "get_financial_summary":
        return OPTools.getFinancialSummary(userId);
      case "create_transaction":
        return OPTools.createTransaction(userId, {
          title: args.title,
          amount: Number(args.amount),
          category: args.category as TransactionCategory,
        });
      case "get_weather_context":
        return weatherService.getWeatherContext().catch(() => null);
      case "get_reminders":
        return OPTools.getReminders(userId);
      case "create_reminder":
        return OPTools.createReminder(userId, {
          title: args.title,
          time: args.time,
          date: args.date,
        });
      case "search_marketplace":
        return marketplaceService.search(args.query, { maxPrice: args.maxPrice });
      default:
        throw new Error(`Tool "${toolName}" is not registered in allowlisted tools.`);
    }
  }
}

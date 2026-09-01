import { OPTools } from "./OPTools";
import { AssistantQueryContext, AssistantIntentType } from "@/types/assistant";
import { weatherService } from "@/services/weatherService";

/**
 * OP AI Context Builder
 * Enforces strict User Data Isolation and retrieves context slices tailored to query intent.
 */
export class ContextBuilder {
  public static async buildContext(
    userId: string,
    intent: AssistantIntentType,
    recentMessages: { sender: "user" | "assistant"; text: string }[] = []
  ): Promise<AssistantQueryContext> {
    if (!userId) {
      throw new Error("ContextBuilder: userId is strictly required for data isolation.");
    }

    // 1. Fetch user profile
    const user = await OPTools.getUserProfile(userId);

    // 2. Fetch context based on intent
    const isMultiDomain = intent === "multi_domain" || intent === "general_chat";
    const isOutfitRelated = intent === "outfit_recommendation" || intent === "fashion_general" || isMultiDomain;
    const isCalendarRelated =
      intent === "calendar_schedule" ||
      intent === "transit_departure" ||
      intent === "readiness_checklist" ||
      intent === "action_create_event" ||
      intent === "outfit_recommendation" ||
      intent === "personal_management" ||
      isMultiDomain;
    const isFinanceRelated =
      intent === "financial_inquiry" ||
      intent === "action_create_transaction" ||
      isMultiDomain;
    const isReminderRelated =
      intent === "readiness_checklist" ||
      intent === "action_create_reminder" ||
      intent === "personal_management" ||
      isMultiDomain;

    const [wardrobe, events, financialPlan, reminders, weather] = await Promise.all([
      isOutfitRelated ? OPTools.getWardrobe(userId) : Promise.resolve([]),
      isCalendarRelated ? OPTools.getUpcomingEvents(userId) : Promise.resolve([]),
      isFinanceRelated ? OPTools.getFinancialSummary(userId) : Promise.resolve(null),
      isReminderRelated ? OPTools.getReminders(userId) : Promise.resolve([]),
      isOutfitRelated || isCalendarRelated
        ? weatherService.getWeatherContext().catch(() => null)
        : Promise.resolve(null),
    ]);

    return {
      userId,
      user,
      wardrobe,
      events,
      financialPlan,
      reminders,
      weather,
      recentMessages,
    };
  }
}

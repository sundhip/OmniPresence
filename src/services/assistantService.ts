import { ChatMessage, AssistantQueryContext, PendingAction } from "@/types/assistant";
import { AssistantEngine } from "@/lib/assistantEngine";
import { ContextBuilder } from "@/lib/ai/ContextBuilder";
import { AIProviderFactory } from "@/lib/ai/AIProvider";
import { OPTools } from "@/lib/ai/OPTools";
import { AppStorage } from "@/lib/storage";

export const assistantService = {
  askAssistant: async (
    query: string,
    recentMessages: { sender: "user" | "assistant"; text: string }[] = []
  ): Promise<ChatMessage> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    const provider = AIProviderFactory.getProvider();
    const intent = await provider.analyzeIntent(query);

    // Build context strictly isolated to current authenticated user
    const context = await ContextBuilder.buildContext(userId, intent, recentMessages);

    return AssistantEngine.generateResponse(query, context);
  },

  executePendingAction: async (
    action: PendingAction
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";

    try {
      if (action.type === "create_transaction") {
        const tx = await OPTools.createTransaction(userId, {
          title: action.payload.txTitle || "Expense",
          amount: action.payload.amount || 0,
          category: action.payload.category || "Other",
        });
        return {
          success: true,
          message: `₹${tx.amount.toLocaleString()} logged under ${tx.category}.`,
          data: tx,
        };
      }

      if (action.type === "create_reminder") {
        const rem = await OPTools.createReminder(userId, {
          title: action.payload.reminderTitle || "Reminder",
          time: action.payload.reminderTime || "09:00",
          date: action.payload.reminderDate,
          type: action.payload.reminderType || "custom",
        });
        return {
          success: true,
          message: `Reminder "${rem.title}" created for ${rem.date} at ${rem.time}.`,
          data: rem,
        };
      }

      if (action.type === "create_event") {
        const ev = await OPTools.createCalendarEvent(userId, {
          title: action.payload.eventTitle || "Event",
          date: action.payload.eventDate || new Date().toISOString().split("T")[0],
          time: action.payload.eventTime || "10:00",
          location: action.payload.eventLocation || "Venue",
        });
        return {
          success: true,
          message: `Event "${ev.title}" scheduled for ${ev.date} at ${ev.time}.`,
          data: ev,
        };
      }

      if (action.type === "mark_worn" && action.payload.itemId) {
        const item = await OPTools.markItemWorn(userId, action.payload.itemId);
        return {
          success: true,
          message: `Marked "${item?.name || "Item"}" as worn today.`,
          data: item,
        };
      }

      throw new Error(`Unsupported action type: ${action.type}`);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to execute action.",
      };
    }
  },
};

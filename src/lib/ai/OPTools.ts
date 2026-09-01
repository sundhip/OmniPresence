import { AppStorage } from "@/lib/storage";
import { UserProfile } from "@/types/user";
import { WardrobeItem } from "@/types/wardrobe";
import { EventItem } from "@/types/events";
import { ReminderItem } from "@/types/reminders";
import { FinancialPlan, FinancialTransaction, TransactionCategory } from "@/types/finance";
import { Outfit } from "@/types/outfit";

/**
 * OP AI Controlled Tool Layer
 * All tools strictly require and validate `userId` to enforce total User Data Isolation.
 */
export class OPTools {
  // -------------------------------------------------------------
  // READ TOOLS
  // -------------------------------------------------------------

  public static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    return AppStorage.getUser(userId);
  }

  public static async getWardrobe(
    userId: string,
    category?: string,
    color?: string
  ): Promise<WardrobeItem[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    const items = AppStorage.getWardrobe(userId);
    return items.filter((item) => {
      if (category && category !== "All") {
        if ((item.category || "").toLowerCase() !== category.toLowerCase()) return false;
      }
      if (color) {
        if (!item.color?.toLowerCase().includes(color.toLowerCase())) return false;
      }
      return true;
    });
  }

  public static async getWearHistory(userId: string, itemId?: string): Promise<any[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    const events = AppStorage.getWearEvents(userId);
    if (itemId) {
      return events.filter((e) => e.wardrobeItemId === itemId);
    }
    return events;
  }

  public static async getSavedOutfits(userId: string): Promise<Outfit[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    return AppStorage.getOutfits(userId);
  }

  public static async getUpcomingEvents(userId: string): Promise<EventItem[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    const events = AppStorage.getEvents(userId);
    const todayStr = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
  }

  public static async getCalendarEvents(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EventItem[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    const events = AppStorage.getEvents(userId);
    return events.filter((e) => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }

  public static async getFinancialSummary(userId: string): Promise<FinancialPlan> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    return AppStorage.getFinancialPlan(userId);
  }

  public static async getReminders(userId: string): Promise<ReminderItem[]> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    return AppStorage.getReminders(userId);
  }

  // -------------------------------------------------------------
  // WRITE TOOLS (Protected mutations scoped to authenticated user)
  // -------------------------------------------------------------

  public static async createTransaction(
    userId: string,
    data: { title: string; amount: number; category: TransactionCategory; notes?: string }
  ): Promise<FinancialTransaction> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    if (!data.title || !data.amount || data.amount <= 0) {
      throw new Error("Invalid transaction parameters");
    }

    const plan = AppStorage.getFinancialPlan(userId);
    const newTx: FinancialTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: data.title,
      amount: Number(data.amount),
      date: new Date().toISOString().split("T")[0],
      category: data.category || "Other",
      notes: data.notes,
    };

    const updatedTransactions = [newTx, ...(plan.transactions || [])];
    const newSpent = updatedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    AppStorage.saveFinancialPlan(userId, {
      ...plan,
      spentThisMonth: newSpent,
      transactions: updatedTransactions,
      updatedAt: new Date().toISOString(),
    });

    return newTx;
  }

  public static async createReminder(
    userId: string,
    data: { title: string; date?: string; time?: string; type?: any; priority?: any; eventId?: string }
  ): Promise<ReminderItem> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    if (!data.title) throw new Error("Reminder title is required");

    const newReminder: ReminderItem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title: data.title,
      date: data.date || new Date().toISOString().split("T")[0],
      time: data.time || "09:00",
      type: data.type || "custom",
      priority: data.priority || "Medium",
      eventId: data.eventId,
      isCompleted: false,
      autoGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    AppStorage.saveReminder(userId, newReminder);
    return newReminder;
  }

  public static async createCalendarEvent(
    userId: string,
    data: { title: string; date: string; time: string; location?: string; type?: any; priority?: any; notes?: string }
  ): Promise<EventItem> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    if (!data.title || !data.date || !data.time) {
      throw new Error("Event title, date, and time are required");
    }

    const newEvent: EventItem = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title: data.title,
      date: data.date,
      time: data.time,
      location: data.location || "Venue",
      type: data.type || "Presentation",
      priority: data.priority || "High",
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    AppStorage.saveEvent(userId, newEvent);
    return newEvent;
  }

  public static async markItemWorn(userId: string, itemId: string): Promise<WardrobeItem | null> {
    if (!userId) throw new Error("Unauthorized: userId is required");
    const wardrobe = AppStorage.getWardrobe(userId);
    const item = wardrobe.find((w) => w.id === itemId);
    if (!item) return null;

    const updated = wardrobe.map((w) =>
      w.id === itemId
        ? {
            ...w,
            wearCount: (w.wearCount || 0) + 1,
            lastWorn: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : w
    );

    AppStorage.saveWardrobe(userId, updated);
    return updated.find((w) => w.id === itemId) || null;
  }
}

import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { Outfit } from "@/types/outfit";
import { UserProfile } from "@/types/user";
import { EventItem } from "@/types/events";
import { ReminderItem } from "@/types/reminders";
import { FinancialPlan } from "@/types/finance";
import {
  INITIAL_USER,
  INITIAL_WARDROBE_ITEMS,
  INITIAL_WEAR_EVENTS,
  INITIAL_OUTFITS,
  INITIAL_EVENTS,
  INITIAL_REMINDERS,
  INITIAL_FINANCIAL_PLAN,
} from "./seedData";

export const DEMO_USER_ID = "user_alex_mercer";

const STORAGE_KEYS = {
  ACTIVE_USER_ID: "op_active_user_id",
  REGISTERED_USERS: "op_registered_users",
  THEME: "op_theme_mode",
  DEMO_INITIALIZED: "op_demo_initialized_v3",
};

// Custom event to sync changes across components
export const DATA_CHANGE_EVENT = "op_data_change";

export function notifyDataChange(entity: string, userId?: string) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent(DATA_CHANGE_EVENT, { detail: { entity, userId } })
      );
    } catch {}
  }
}

export class AppStorage {
  public static isClient(): boolean {
    return typeof window !== "undefined";
  }

  private static memoryStore: Map<string, string> = new Map();

  private static getItem(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryStore.get(key) || null;
      }
    }
    return this.memoryStore.get(key) || null;
  }

  private static setItem(key: string, value: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    }
    this.memoryStore.set(key, value);
  }

  private static removeItem(key: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    this.memoryStore.delete(key);
  }

  // Active Authenticated User ID
  public static getActiveUserId(): string | null {
    return this.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
  }

  public static setActiveUserId(userId: string | null): void {
    if (userId) {
      this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    } else {
      this.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    }
    notifyDataChange("session");
  }

  // Registered Users Registry
  public static getRegisteredUsers(): UserProfile[] {
    if (!this.isClient()) return [INITIAL_USER];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (!data) return [INITIAL_USER];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_USER];
    } catch {
      return [INITIAL_USER];
    }
  }

  public static saveRegisteredUsers(users: UserProfile[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
      notifyDataChange("users");
    } catch (e) {
      console.error("Failed to save registered users:", e);
    }
  }

  // Initialize Demo User data in isolation
  public static initializeDemoUser(): void {
    if (!this.isClient()) return;
    try {
      const demoInit = localStorage.getItem(STORAGE_KEYS.DEMO_INITIALIZED);
      if (!demoInit) {
        // Save demo profile, wardrobe, events, outfits under demo user ID
        this.saveUser(DEMO_USER_ID, INITIAL_USER);
        this.saveWardrobe(DEMO_USER_ID, INITIAL_WARDROBE_ITEMS);
        this.saveWearEvents(DEMO_USER_ID, INITIAL_WEAR_EVENTS);
        this.saveOutfits(DEMO_USER_ID, INITIAL_OUTFITS);
        this.saveEvents(DEMO_USER_ID, INITIAL_EVENTS);
        this.saveReminders(DEMO_USER_ID, INITIAL_REMINDERS);
        this.saveFinancialPlan(DEMO_USER_ID, INITIAL_FINANCIAL_PLAN);

        // Ensure demo user is in registered users
        const registered = this.getRegisteredUsers();
        if (!registered.some((u) => u.id === DEMO_USER_ID)) {
          registered.push(INITIAL_USER);
          this.saveRegisteredUsers(registered);
        }

        localStorage.setItem(STORAGE_KEYS.DEMO_INITIALIZED, "true");
      }
    } catch (e) {
      console.error("Failed to initialize demo user:", e);
    }
  }

  // User Profile (strictly keyed by userId)
  public static getUser(userId: string): UserProfile | null {
    if (!this.isClient() || !userId) return null;
    try {
      const data = localStorage.getItem(`op_user_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_USER;
      }
      return null;
    } catch {
      return null;
    }
  }

  public static saveUser(userId: string, user: UserProfile): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_user_${userId}`, JSON.stringify(user));

      const registered = this.getRegisteredUsers();
      const idx = registered.findIndex((u) => u.id === userId || u.email === user.email);
      if (idx >= 0) {
        registered[idx] = user;
      } else {
        registered.push(user);
      }
      this.saveRegisteredUsers(registered);

      notifyDataChange("user", userId);
    } catch (e) {
      console.error("Failed to save user profile:", e);
    }
  }

  // Wardrobe Items (strictly keyed by userId)
  public static getWardrobe(userId: string): WardrobeItem[] {
    if (!this.isClient() || !userId) return [];
    try {
      const data = localStorage.getItem(`op_wardrobe_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_WARDROBE_ITEMS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveWardrobe(userId: string, items: WardrobeItem[]): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_wardrobe_${userId}`, JSON.stringify(items));
      notifyDataChange("wardrobe", userId);
    } catch (e) {
      console.error("Failed to save wardrobe:", e);
    }
  }

  // Wear Events (strictly keyed by userId)
  public static getWearEvents(userId: string): WearEvent[] {
    if (!this.isClient() || !userId) return [];
    try {
      const data = localStorage.getItem(`op_wear_events_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_WEAR_EVENTS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveWearEvents(userId: string, events: WearEvent[]): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_wear_events_${userId}`, JSON.stringify(events));
      notifyDataChange("wear_events", userId);
    } catch (e) {
      console.error("Failed to save wear events:", e);
    }
  }

  // Outfits (strictly keyed by userId)
  public static getOutfits(userId: string): Outfit[] {
    if (!this.isClient() || !userId) return [];
    try {
      const data = localStorage.getItem(`op_outfits_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_OUTFITS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveOutfits(userId: string, outfits: Outfit[]): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_outfits_${userId}`, JSON.stringify(outfits));
      notifyDataChange("outfits", userId);
    } catch (e) {
      console.error("Failed to save outfits:", e);
    }
  }

  // -------------------------------------------------------------
  // Events / Calendar (strictly keyed by userId)
  // -------------------------------------------------------------
  public static getEvents(userId: string): EventItem[] {
    if (!this.isClient() || !userId) return [];
    try {
      const data = localStorage.getItem(`op_events_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_EVENTS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveEvents(userId: string, events: EventItem[]): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_events_${userId}`, JSON.stringify(events));
      notifyDataChange("events", userId);
    } catch (e) {
      console.error("Failed to save events:", e);
    }
  }

  public static getEvent(userId: string, eventId: string): EventItem | null {
    const events = this.getEvents(userId);
    return events.find((e) => e.id === eventId) || null;
  }

  public static saveEvent(userId: string, event: EventItem): void {
    const events = this.getEvents(userId);
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      events[idx] = { ...event, updatedAt: new Date().toISOString() };
    } else {
      events.push({
        ...event,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveEvents(userId, events);
  }

  public static deleteEvent(userId: string, eventId: string): void {
    const events = this.getEvents(userId);
    const filtered = events.filter((e) => e.id !== eventId);
    this.saveEvents(userId, filtered);

    // Also delete associated reminders
    const reminders = this.getReminders(userId);
    const filteredReminders = reminders.filter((r) => r.eventId !== eventId);
    this.saveReminders(userId, filteredReminders);
  }

  // -------------------------------------------------------------
  // Reminders (strictly keyed by userId)
  // -------------------------------------------------------------
  public static getReminders(userId: string): ReminderItem[] {
    if (!this.isClient() || !userId) return [];
    try {
      const data = localStorage.getItem(`op_reminders_${userId}`);
      if (data) return JSON.parse(data);

      if (userId === DEMO_USER_ID) {
        return INITIAL_REMINDERS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public static saveReminders(userId: string, reminders: ReminderItem[]): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(`op_reminders_${userId}`, JSON.stringify(reminders));
      notifyDataChange("reminders", userId);
    } catch (e) {
      console.error("Failed to save reminders:", e);
    }
  }

  public static saveReminder(userId: string, reminder: ReminderItem): void {
    const reminders = this.getReminders(userId);
    const idx = reminders.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) {
      reminders[idx] = { ...reminder, updatedAt: new Date().toISOString() };
    } else {
      reminders.push({
        ...reminder,
        createdAt: reminder.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveReminders(userId, reminders);
  }

  public static deleteReminder(userId: string, reminderId: string): void {
    const reminders = this.getReminders(userId);
    const filtered = reminders.filter((r) => r.id !== reminderId);
    this.saveReminders(userId, filtered);
  }

  // -------------------------------------------------------------
  // Financial Plan & Goals (strictly keyed by userId)
  // -------------------------------------------------------------
  public static getFinancialPlan(userId: string): FinancialPlan {
    const defaultPlan: FinancialPlan = {
      userId,
      monthlyBudget: 0,
      monthlyFashionBudget: 0,
      clothingBudget: 0,
      shoppingLimit: 0,
      savingsGoal: 0,
      spentThisMonth: 0,
      currency: "₹",
      transactions: [],
      updatedAt: new Date().toISOString(),
    };

    if (!this.isClient() || !userId) return defaultPlan;
    try {
      const data = localStorage.getItem(`op_finance_${userId}`);
      let parsedPlan: FinancialPlan = defaultPlan;
      if (data) {
        parsedPlan = JSON.parse(data);
      } else if (userId === DEMO_USER_ID) {
        parsedPlan = INITIAL_FINANCIAL_PLAN;
      }

      const totalSpent = (parsedPlan.transactions || []).reduce(
        (sum, tx) => sum + (Number(tx.amount) || 0),
        0
      );

      return {
        ...defaultPlan,
        ...parsedPlan,
        spentThisMonth: totalSpent,
      };
    } catch {
      return defaultPlan;
    }
  }

  public static saveFinancialPlan(userId: string, plan: FinancialPlan): void {
    if (!this.isClient() || !userId) return;
    try {
      localStorage.setItem(
        `op_finance_${userId}`,
        JSON.stringify({ ...plan, userId, updatedAt: new Date().toISOString() })
      );
      notifyDataChange("finance", userId);
    } catch (e) {
      console.error("Failed to save financial plan:", e);
    }
  }

  // Reset user's wardrobe & data to clean/demo state
  public static resetUserToDefault(userId: string): void {
    if (!this.isClient() || !userId) return;
    try {
      if (userId === DEMO_USER_ID) {
        this.saveUser(DEMO_USER_ID, INITIAL_USER);
        this.saveWardrobe(DEMO_USER_ID, INITIAL_WARDROBE_ITEMS);
        this.saveWearEvents(DEMO_USER_ID, INITIAL_WEAR_EVENTS);
        this.saveOutfits(DEMO_USER_ID, INITIAL_OUTFITS);
        this.saveEvents(DEMO_USER_ID, INITIAL_EVENTS);
        this.saveReminders(DEMO_USER_ID, INITIAL_REMINDERS);
        this.saveFinancialPlan(DEMO_USER_ID, INITIAL_FINANCIAL_PLAN);
      } else {
        this.saveWardrobe(userId, []);
        this.saveWearEvents(userId, []);
        this.saveOutfits(userId, []);
        this.saveEvents(userId, []);
        this.saveReminders(userId, []);
        this.saveFinancialPlan(userId, {
          userId,
          monthlyBudget: 0,
          monthlyFashionBudget: 0,
          clothingBudget: 0,
          shoppingLimit: 0,
          savingsGoal: 0,
          spentThisMonth: 0,
          currency: "₹",
          transactions: [],
          updatedAt: new Date().toISOString(),
        });
      }
      notifyDataChange("all", userId);
    } catch (e) {
      console.error("Failed to reset user storage:", e);
    }
  }

  // Export current user's data as JSON
  public static exportUserData(userId: string): string {
    const data = {
      version: "3.0.0",
      userId,
      exportedAt: new Date().toISOString(),
      user: this.getUser(userId),
      wardrobe: this.getWardrobe(userId),
      wearEvents: this.getWearEvents(userId),
      outfits: this.getOutfits(userId),
      events: this.getEvents(userId),
      reminders: this.getReminders(userId),
      financialPlan: this.getFinancialPlan(userId),
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data for current user
  public static importUserData(userId: string, jsonString: string): boolean {
    if (!this.isClient() || !userId) return false;
    try {
      const data = JSON.parse(jsonString);
      if (data.user) this.saveUser(userId, { ...data.user, id: userId });
      if (Array.isArray(data.wardrobe)) {
        this.saveWardrobe(
          userId,
          data.wardrobe.map((item: WardrobeItem) => ({ ...item, userId }))
        );
      }
      if (Array.isArray(data.wearEvents)) this.saveWearEvents(userId, data.wearEvents);
      if (Array.isArray(data.outfits)) {
        this.saveOutfits(
          userId,
          data.outfits.map((outfit: Outfit) => ({ ...outfit, userId }))
        );
      }
      if (Array.isArray(data.events)) {
        this.saveEvents(
          userId,
          data.events.map((event: EventItem) => ({ ...event, userId }))
        );
      }
      if (Array.isArray(data.reminders)) {
        this.saveReminders(
          userId,
          data.reminders.map((r: ReminderItem) => ({ ...r, userId }))
        );
      }
      if (data.financialPlan) {
        this.saveFinancialPlan(userId, { ...data.financialPlan, userId });
      }
      notifyDataChange("all", userId);
      return true;
    } catch (e) {
      console.error("Failed to import user data:", e);
      return false;
    }
  }

  // User-Isolated Saved Marketplace Products
  public static getSavedProducts(userId: string): any[] {
    if (!userId) return [];
    try {
      const data = this.getItem(`op_saved_products_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveMarketplaceProduct(userId: string, product: any): void {
    if (!userId || !product) return;
    try {
      const existing = this.getSavedProducts(userId);
      const isAlreadySaved = existing.some((p) => (p.product?.id || p.id) === product.id);
      if (!isAlreadySaved) {
        const item = {
          id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          product,
          savedAt: new Date().toISOString(),
        };
        existing.unshift(item);
        this.setItem(`op_saved_products_${userId}`, JSON.stringify(existing));
        notifyDataChange("savedProducts", userId);
      }
    } catch (e) {
      console.error("Failed to save marketplace product:", e);
    }
  }

  public static removeSavedMarketplaceProduct(userId: string, productId: string): void {
    if (!userId || !productId) return;
    try {
      const existing = this.getSavedProducts(userId);
      const filtered = existing.filter((p) => (p.product?.id || p.id) !== productId);
      this.setItem(`op_saved_products_${userId}`, JSON.stringify(filtered));
      notifyDataChange("savedProducts", userId);
    } catch (e) {
      console.error("Failed to remove saved marketplace product:", e);
    }
  }

  public static isProductSaved(userId: string, productId: string): boolean {
    if (!userId || !productId) return false;
    const existing = this.getSavedProducts(userId);
    return existing.some((p) => (p.product?.id || p.id) === productId);
  }
}


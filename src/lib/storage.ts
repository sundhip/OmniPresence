import { WardrobeItem, WearEvent } from "@/types/wardrobe";
import { Outfit } from "@/types/outfit";
import { UserProfile } from "@/types/user";
import {
  INITIAL_USER,
  INITIAL_WARDROBE_ITEMS,
  INITIAL_WEAR_EVENTS,
  INITIAL_OUTFITS,
} from "./seedData";

export const DEMO_USER_ID = "user_alex_mercer";

const STORAGE_KEYS = {
  ACTIVE_USER_ID: "op_active_user_id",
  REGISTERED_USERS: "op_registered_users",
  THEME: "op_theme_mode",
  DEMO_INITIALIZED: "op_demo_initialized_v2",
};

// Custom event to sync changes across components
export const DATA_CHANGE_EVENT = "op_data_change";

export function notifyDataChange(entity: string, userId?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(DATA_CHANGE_EVENT, { detail: { entity, userId } })
    );
  }
}

export class AppStorage {
  private static isClient(): boolean {
    return typeof window !== "undefined";
  }

  // Active Authenticated User ID
  public static getActiveUserId(): string | null {
    if (!this.isClient()) return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    } catch {
      return null;
    }
  }

  public static setActiveUserId(userId: string | null): void {
    if (!this.isClient()) return;
    try {
      if (userId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
      }
      notifyDataChange("session");
    } catch (e) {
      console.error("Failed to set active user ID:", e);
    }
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

      // If demo user and not loaded yet, initialize
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

      // Update in registered users registry
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

      // Fallback for demo user
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

  // Reset user's wardrobe & data to clean/demo state
  public static resetUserToDefault(userId: string): void {
    if (!this.isClient() || !userId) return;
    try {
      if (userId === DEMO_USER_ID) {
        this.saveUser(DEMO_USER_ID, INITIAL_USER);
        this.saveWardrobe(DEMO_USER_ID, INITIAL_WARDROBE_ITEMS);
        this.saveWearEvents(DEMO_USER_ID, INITIAL_WEAR_EVENTS);
        this.saveOutfits(DEMO_USER_ID, INITIAL_OUTFITS);
      } else {
        const user = this.getUser(userId);
        if (user) {
          this.saveWardrobe(userId, []);
          this.saveWearEvents(userId, []);
          this.saveOutfits(userId, []);
        }
      }
      notifyDataChange("all", userId);
    } catch (e) {
      console.error("Failed to reset user storage:", e);
    }
  }

  // Export current user's data as JSON
  public static exportUserData(userId: string): string {
    const data = {
      version: "2.0.0",
      userId,
      exportedAt: new Date().toISOString(),
      user: this.getUser(userId),
      wardrobe: this.getWardrobe(userId),
      wearEvents: this.getWearEvents(userId),
      outfits: this.getOutfits(userId),
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
      notifyDataChange("all", userId);
      return true;
    } catch (e) {
      console.error("Failed to import user data:", e);
      return false;
    }
  }
}

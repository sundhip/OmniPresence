import { WardrobeFilterOptions, WardrobeItem, WearEvent } from "@/types/wardrobe";
import { AppStorage, DEMO_USER_ID } from "@/lib/storage";
import { generateId } from "@/lib/utils";

function resolveUserId(providedId?: string): string {
  if (providedId) return providedId;
  const active = AppStorage.getActiveUserId();
  return active || DEMO_USER_ID;
}

export const wardrobeService = {
  // Get all items belonging strictly to active user
  getItems: async (
    filters?: WardrobeFilterOptions,
    userId?: string
  ): Promise<WardrobeItem[]> => {
    const uid = resolveUserId(userId);
    let items = AppStorage.getWardrobe(uid);

    if (!filters) return items;

    // Filter by Category
    if (filters.category && filters.category !== "All") {
      items = items.filter((item) => item.category === filters.category);
    }

    // Filter by Search Query (name, category, subcategory, color, brand, occasion, notes)
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const q = filters.searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          item.secondaryColors?.some((sc) => sc.toLowerCase().includes(q)) ||
          item.brand?.toLowerCase().includes(q) ||
          item.occasion.some((occ) => occ.toLowerCase().includes(q)) ||
          item.notes?.toLowerCase().includes(q)
      );
    }

    // Filter by Colors
    if (filters.colors && filters.colors.length > 0) {
      const selectedColors = filters.colors.map((c) => c.toLowerCase());
      items = items.filter(
        (item) =>
          selectedColors.includes(item.color.toLowerCase()) ||
          item.secondaryColors?.some((sc) => selectedColors.includes(sc.toLowerCase()))
      );
    }

    // Filter by Seasons
    if (filters.seasons && filters.seasons.length > 0) {
      items = items.filter((item) =>
        item.season.some((s) => filters.seasons?.includes(s) || s === "All-Season")
      );
    }

    // Filter by Occasions
    if (filters.occasions && filters.occasions.length > 0) {
      items = items.filter((item) =>
        item.occasion.some((occ) => filters.occasions?.includes(occ))
      );
    }

    // Filter by Favorite
    if (filters.favoriteOnly) {
      items = items.filter((item) => item.favorite);
    }

    // Filter by Wear Frequency
    if (filters.wearFrequency && filters.wearFrequency !== "all") {
      if (filters.wearFrequency === "never") {
        items = items.filter((item) => item.wearCount === 0);
      } else if (filters.wearFrequency === "low") {
        items = items.filter((item) => item.wearCount > 0 && item.wearCount <= 5);
      } else if (filters.wearFrequency === "medium") {
        items = items.filter((item) => item.wearCount > 5 && item.wearCount <= 15);
      } else if (filters.wearFrequency === "high") {
        items = items.filter((item) => item.wearCount > 15);
      }
    }

    // Sorting
    const sortBy = filters.sortBy || "recentlyAdded";
    items = [...items].sort((a, b) => {
      if (sortBy === "recentlyAdded") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "recentlyWorn") {
        if (!a.lastWorn && !b.lastWorn) return 0;
        if (!a.lastWorn) return 1;
        if (!b.lastWorn) return -1;
        return new Date(b.lastWorn).getTime() - new Date(a.lastWorn).getTime();
      }
      if (sortBy === "mostWorn") {
        return b.wearCount - a.wearCount;
      }
      if (sortBy === "leastWorn") {
        return a.wearCount - b.wearCount;
      }
      if (sortBy === "nameAsc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "nameDesc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return items;
  },

  // Get single item by ID for active user
  getItemById: async (id: string, userId?: string): Promise<WardrobeItem | null> => {
    const uid = resolveUserId(userId);
    const items = AppStorage.getWardrobe(uid);
    return items.find((i) => i.id === id) || null;
  },

  // Create new item in active user's wardrobe
  addItem: async (
    item: Omit<WardrobeItem, "id" | "createdAt" | "updatedAt">,
    userId?: string
  ): Promise<WardrobeItem> => {
    const uid = resolveUserId(userId || item.userId);
    const items = AppStorage.getWardrobe(uid);

    const newItem: WardrobeItem = {
      ...item,
      id: generateId("item"),
      userId: uid,
      wearCount: item.wearCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    AppStorage.saveWardrobe(uid, items);
    return newItem;
  },

  // Update item in active user's wardrobe
  updateItem: async (
    id: string,
    updates: Partial<WardrobeItem>,
    userId?: string
  ): Promise<WardrobeItem> => {
    const uid = resolveUserId(userId);
    const items = AppStorage.getWardrobe(uid);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Wardrobe item not found in user catalog");

    const updated: WardrobeItem = {
      ...items[index],
      ...updates,
      userId: uid,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    AppStorage.saveWardrobe(uid, items);
    return updated;
  },

  // Delete item from active user's wardrobe
  deleteItem: async (id: string, userId?: string): Promise<boolean> => {
    const uid = resolveUserId(userId);
    let items = AppStorage.getWardrobe(uid);
    const initialLen = items.length;
    items = items.filter((i) => i.id !== id);
    if (items.length !== initialLen) {
      AppStorage.saveWardrobe(uid, items);
      return true;
    }
    return false;
  },

  // Toggle favorite for item
  toggleFavorite: async (id: string, userId?: string): Promise<WardrobeItem> => {
    const uid = resolveUserId(userId);
    const item = await wardrobeService.getItemById(id, uid);
    if (!item) throw new Error("Item not found");
    return wardrobeService.updateItem(id, { favorite: !item.favorite }, uid);
  },

  // Record item worn today
  recordWear: async (
    id: string,
    occasion: string = "Everyday",
    notes?: string,
    userId?: string
  ): Promise<{ item: WardrobeItem; event: WearEvent }> => {
    const uid = resolveUserId(userId);
    const item = await wardrobeService.getItemById(id, uid);
    if (!item) throw new Error("Item not found");

    const todayIso = new Date().toISOString();
    const updatedItem = await wardrobeService.updateItem(
      id,
      {
        wearCount: (item.wearCount || 0) + 1,
        lastWorn: todayIso,
      },
      uid
    );

    const newEvent: WearEvent = {
      id: generateId("wear"),
      wardrobeItemId: id,
      date: todayIso.split("T")[0],
      occasion,
      notes,
      createdAt: todayIso,
    };

    const events = AppStorage.getWearEvents(uid);
    events.unshift(newEvent);
    AppStorage.saveWearEvents(uid, events);

    return { item: updatedItem, event: newEvent };
  },

  // Get wear history for an item
  getItemWearHistory: async (id: string, userId?: string): Promise<WearEvent[]> => {
    const uid = resolveUserId(userId);
    const events = AppStorage.getWearEvents(uid);
    return events.filter((e) => e.wardrobeItemId === id);
  },

  // Get all wear events for user
  getWearEvents: async (userId?: string): Promise<WearEvent[]> => {
    const uid = resolveUserId(userId);
    return AppStorage.getWearEvents(uid);
  },
};

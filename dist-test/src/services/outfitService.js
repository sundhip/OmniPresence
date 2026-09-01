import { AppStorage, DEMO_USER_ID } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { wardrobeService } from "./wardrobeService";
function resolveUserId(providedId) {
    if (providedId)
        return providedId;
    const active = AppStorage.getActiveUserId();
    return active || DEMO_USER_ID;
}
export const outfitService = {
    // Get all outfits for active user
    getOutfits: async (userId) => {
        const uid = resolveUserId(userId);
        return AppStorage.getOutfits(uid);
    },
    // Get single outfit by ID
    getOutfitById: async (id, userId) => {
        const uid = resolveUserId(userId);
        const outfits = AppStorage.getOutfits(uid);
        return outfits.find((o) => o.id === id) || null;
    },
    // Get populated outfit with full item objects from user's wardrobe
    getPopulatedOutfit: async (id, userId) => {
        const uid = resolveUserId(userId);
        const outfit = await outfitService.getOutfitById(id, uid);
        if (!outfit)
            return null;
        const wardrobe = await wardrobeService.getItems(undefined, uid);
        const itemMap = new Map(wardrobe.map((i) => [i.id, i]));
        const populatedItems = outfit.items
            .map((itemId) => itemMap.get(itemId))
            .filter((i) => Boolean(i));
        return {
            ...outfit,
            items: populatedItems,
        };
    },
    // Get all populated outfits for active user
    getAllPopulatedOutfits: async (userId) => {
        const uid = resolveUserId(userId);
        const outfits = await outfitService.getOutfits(uid);
        const wardrobe = await wardrobeService.getItems(undefined, uid);
        const itemMap = new Map(wardrobe.map((i) => [i.id, i]));
        return outfits.map((outfit) => ({
            ...outfit,
            items: outfit.items
                .map((id) => itemMap.get(id))
                .filter((i) => Boolean(i)),
        }));
    },
    // Create outfit in active user's plan
    createOutfit: async (outfit, userId) => {
        const uid = resolveUserId(userId || outfit.userId);
        const outfits = AppStorage.getOutfits(uid);
        const newOutfit = {
            ...outfit,
            id: generateId("outfit"),
            userId: uid,
            wearCount: outfit.wearCount || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        outfits.unshift(newOutfit);
        AppStorage.saveOutfits(uid, outfits);
        return newOutfit;
    },
    // Update outfit
    updateOutfit: async (id, updates, userId) => {
        const uid = resolveUserId(userId);
        const outfits = AppStorage.getOutfits(uid);
        const index = outfits.findIndex((o) => o.id === id);
        if (index === -1)
            throw new Error("Outfit not found in user plan");
        const updated = {
            ...outfits[index],
            ...updates,
            userId: uid,
            updatedAt: new Date().toISOString(),
        };
        outfits[index] = updated;
        AppStorage.saveOutfits(uid, outfits);
        return updated;
    },
    // Delete outfit
    deleteOutfit: async (id, userId) => {
        const uid = resolveUserId(userId);
        let outfits = AppStorage.getOutfits(uid);
        const initialLen = outfits.length;
        outfits = outfits.filter((o) => o.id !== id);
        if (outfits.length !== initialLen) {
            AppStorage.saveOutfits(uid, outfits);
            return true;
        }
        return false;
    },
    // Wear entire outfit today
    wearOutfit: async (id, userId) => {
        const uid = resolveUserId(userId);
        const outfit = await outfitService.getOutfitById(id, uid);
        if (!outfit)
            throw new Error("Outfit not found");
        const todayIso = new Date().toISOString();
        // Record wear for each item in outfit under active user
        for (const itemId of outfit.items) {
            try {
                await wardrobeService.recordWear(itemId, outfit.occasion, `Worn as part of outfit: ${outfit.name}`, uid);
            }
            catch (e) {
                console.warn(`Failed to log wear for item ${itemId}:`, e);
            }
        }
        const updated = await outfitService.updateOutfit(id, {
            wearCount: (outfit.wearCount || 0) + 1,
            lastWorn: todayIso,
        }, uid);
        return updated;
    },
};

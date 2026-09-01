import { AppStorage, DEMO_USER_ID } from "@/lib/storage";
import { INITIAL_USER } from "@/lib/seedData";
function resolveUserId(providedId) {
    if (providedId)
        return providedId;
    const active = AppStorage.getActiveUserId();
    return active || DEMO_USER_ID;
}
export const profileService = {
    // Get active user profile
    getProfile: async (userId) => {
        const uid = resolveUserId(userId);
        const user = AppStorage.getUser(uid);
        return user || INITIAL_USER;
    },
    // Update profile for active user
    updateProfile: async (updates, userId) => {
        const uid = resolveUserId(userId);
        const current = (await profileService.getProfile(uid)) || INITIAL_USER;
        const updated = {
            ...current,
            ...updates,
            id: uid,
            updatedAt: new Date().toISOString(),
        };
        AppStorage.saveUser(uid, updated);
        return updated;
    },
    // Complete onboarding
    completeOnboarding: async (data, userId) => {
        return profileService.updateProfile({
            ...data,
            onboarded: true,
        }, userId);
    },
};

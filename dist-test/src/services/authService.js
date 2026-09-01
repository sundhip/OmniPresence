import { AppStorage, DEMO_USER_ID } from "@/lib/storage";
import { INITIAL_USER } from "@/lib/seedData";
import { generateId } from "@/lib/utils";
export const authService = {
    // Get current authenticated user
    getCurrentUser: async () => {
        if (typeof window === "undefined")
            return null;
        const activeUserId = AppStorage.getActiveUserId();
        if (!activeUserId)
            return null;
        const user = AppStorage.getUser(activeUserId);
        return user;
    },
    // Sign in existing user or auto-register by email/name
    signIn: async (emailOrName, password) => {
        AppStorage.initializeDemoUser();
        const cleanInput = emailOrName.trim().toLowerCase();
        // Check if demo user
        if (cleanInput.includes("alex") || cleanInput.includes("demo")) {
            AppStorage.setActiveUserId(DEMO_USER_ID);
            return AppStorage.getUser(DEMO_USER_ID) || INITIAL_USER;
        }
        // Check existing registered users
        const registered = AppStorage.getRegisteredUsers();
        let existing = registered.find((u) => u.email.toLowerCase() === cleanInput ||
            u.name.toLowerCase() === cleanInput);
        if (!existing) {
            // Create user account for this name/email with isolated clean wardrobe
            const newUserId = generateId(`user_${cleanInput.replace(/[^a-z0-9]/g, "")}`);
            existing = {
                ...INITIAL_USER,
                id: newUserId,
                name: emailOrName.includes("@") ? emailOrName.split("@")[0] : emailOrName,
                email: emailOrName.includes("@") ? emailOrName : `${cleanInput}@example.com`,
                bio: `Member of OmniPresence Personal Intelligence.`,
                onboarded: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            AppStorage.saveUser(newUserId, existing);
            AppStorage.saveWardrobe(newUserId, []);
            AppStorage.saveWearEvents(newUserId, []);
            AppStorage.saveOutfits(newUserId, []);
        }
        AppStorage.setActiveUserId(existing.id);
        return existing;
    },
    // Sign up new user
    signUp: async (name, email, password) => {
        AppStorage.initializeDemoUser();
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const prefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
        const newUserId = generateId(`user_${prefix}`);
        const newUser = {
            ...INITIAL_USER,
            id: newUserId,
            name: cleanName,
            email: cleanEmail,
            bio: "Member of OmniPresence Personal Intelligence.",
            onboarded: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Save strictly isolated user data
        AppStorage.saveUser(newUserId, newUser);
        AppStorage.saveWardrobe(newUserId, []);
        AppStorage.saveWearEvents(newUserId, []);
        AppStorage.saveOutfits(newUserId, []);
        AppStorage.setActiveUserId(newUserId);
        return newUser;
    },
    // Sign out
    signOut: async () => {
        if (typeof window !== "undefined") {
            AppStorage.setActiveUserId(null);
        }
    },
    // Demo Sign in (Alex Mercer)
    demoSignIn: async () => {
        AppStorage.initializeDemoUser();
        AppStorage.setActiveUserId(DEMO_USER_ID);
        const demoUser = AppStorage.getUser(DEMO_USER_ID) || INITIAL_USER;
        return demoUser;
    },
};

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types/user";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { AppStorage, DATA_CHANGE_EVENT } from "@/lib/storage";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<UserProfile>;
  signUp: (name: string, email: string, password?: string) => Promise<UserProfile>;
  demoSignIn: () => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      AppStorage.initializeDemoUser();
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error("Auth init error:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for data sync events across components
    const handleStorageChange = (e: any) => {
      const activeId = AppStorage.getActiveUserId();
      if (!activeId) {
        setUser(null);
        return;
      }
      if (
        e.detail?.entity === "session" ||
        e.detail?.entity === "user" ||
        e.detail?.entity === "all"
      ) {
        if (!e.detail.userId || e.detail.userId === activeId) {
          const updated = AppStorage.getUser(activeId);
          setUser(updated);
        }
      }
    };

    window.addEventListener(DATA_CHANGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, handleStorageChange);
  }, [refreshUser]);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.signIn(email, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    try {
      const newUser = await authService.signUp(name, email, password);
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const demoSignIn = async () => {
    setIsLoading(true);
    try {
      const demoUser = await authService.demoSignIn();
      setUser(demoUser);
      return demoUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      // Immediately redirect to landing page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("Not authenticated");
    const updated = await profileService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        signIn,
        signUp,
        demoSignIn,
        signOut,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, demoSignIn } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("alex.mercer@omnipresence.ai");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastError("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      success("Welcome back", "Signed in successfully to OmniPresence.");
      router.push("/home");
    } catch (err: any) {
      toastError("Sign in failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    try {
      await demoSignIn();
      success("Demo session active", "Signed in as Alex Mercer with full sample wardrobe.");
      router.push("/home");
    } catch (err: any) {
      toastError("Demo login failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div
        className="w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-6 animate-fade-in"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6657D9] via-[#8B74EC] to-[#C8B5FF] text-white shadow-md mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Sign In to OmniPresence
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Access your personal digital wardrobe and OP AI intelligence.
          </p>
        </div>

        {/* Demo Mode Instant Access Button */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full justify-center bg-[var(--surface-soft)] font-bold text-xs"
          onClick={handleDemoSignIn}
          disabled={isLoading}
          leftIcon={<Sparkles className="w-4 h-4 text-[var(--primary)]" />}
        >
          Instant 1-Click Demo Mode (Alex Mercer)
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[var(--border-subtle)] w-full" />
          <span className="bg-[var(--surface)] px-3 text-[11px] uppercase font-bold text-[var(--text-muted)] absolute">
            or sign in with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Footer Links */}
        <div className="text-center text-xs text-[var(--text-secondary)] pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--primary)] font-bold hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

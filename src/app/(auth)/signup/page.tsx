"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toastError("Please fill in your name and email");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      success("Account created", "Welcome to OmniPresence! Let's personalize your experience.");
      router.push("/onboarding");
    } catch (err: any) {
      toastError("Registration failed", err.message);
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
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#6657D9] via-[#8B74EC] to-[#C8B5FF] text-white shadow-md mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Create Your Account
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Begin with your digital wardrobe and personal intelligence.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Alex Mercer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address *"
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
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account & Onboard
          </Button>
        </form>

        <div className="text-center text-xs text-[var(--text-secondary)] pt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

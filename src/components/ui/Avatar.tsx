"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, name = "User", size = "md", className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const getInitials = (n: string) => {
    if (!n) return "U";
    return n
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center font-semibold overflow-hidden flex-shrink-0 border select-none",
        "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--border)]",
        sizeStyles[size],
        className
      )}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-[var(--primary)]" />
      )}
    </div>
  );
}

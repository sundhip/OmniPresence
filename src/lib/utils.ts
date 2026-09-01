import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { COLOR_HEX_MAP } from "./colorVocabulary";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "Never worn";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Worn today";
    if (diffDays === 1) return "Worn yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "Unknown";
  }
}

export function getColorHex(colorName: string): string {
  if (!colorName) return "#94A3B8";
  const direct = COLOR_HEX_MAP[colorName];
  if (direct) return direct;
  const lower = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (key.toLowerCase() === lower) return hex;
  }
  return "#94A3B8";
}

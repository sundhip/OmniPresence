import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function generateId(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
export function formatDate(dateString) {
    if (!dateString)
        return "Never";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime()))
            return dateString;
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        });
    }
    catch {
        return dateString;
    }
}
export function formatTimeAgo(dateString) {
    if (!dateString)
        return "Never worn";
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0)
            return "Worn today";
        if (diffDays === 1)
            return "Worn yesterday";
        if (diffDays < 7)
            return `${diffDays} days ago`;
        if (diffDays < 30)
            return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }
    catch {
        return "Unknown";
    }
}
export function getColorHex(colorName) {
    const map = {
        black: "#171526",
        white: "#FFFFFF",
        navy: "#1E293B",
        blue: "#2563EB",
        grey: "#64748B",
        gray: "#64748B",
        beige: "#D4C5B9",
        brown: "#78350F",
        cream: "#FFFDD0",
        olive: "#4D7C0F",
        green: "#16A34A",
        burgundy: "#831843",
        red: "#DC2626",
        pink: "#EC4899",
        purple: "#7C3AED",
        lavender: "#C8B5FF",
        cyan: "#06B6D4",
        yellow: "#EAB308",
        orange: "#EA580C",
        khaki: "#C3B091",
        charcoal: "#334155",
        tan: "#D2B48C",
    };
    return map[colorName.toLowerCase()] || "#94A3B8";
}

import { ControlledColor, PRIMARY_COLORS, EXTENDED_COLORS, normalizeColor } from "./colorVocabulary";

export interface ColorExtractionResult {
  primaryColor: ControlledColor;
  secondaryColors: ControlledColor[];
  confidence: "high" | "medium" | "low";
  detectedGarmentPalette: string[];
}

/**
 * Convert RGB to HSV
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Identify if a pixel is likely human skin tone to avoid biasing garment color detection
 */
function isLikelySkinTone(r: number, g: number, b: number, hsv: { h: number; s: number; v: number }): boolean {
  // Standard skin tone rules
  const rgbSkin =
    r > 95 &&
    g > 40 &&
    b > 20 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
    Math.abs(r - g) > 12 &&
    r > g &&
    r > b;

  const hsvSkin = hsv.h >= 10 && hsv.h <= 32 && hsv.s >= 18 && hsv.s <= 68 && hsv.v >= 30;

  return rgbSkin || hsvSkin;
}

/**
 * Map an HSV pixel to a controlled color
 */
function classifyHsvPixel(hsv: { h: number; s: number; v: number }): ControlledColor {
  const { h, s, v } = hsv;

  // Very dark -> Black
  if (v <= 18 || (s <= 15 && v <= 25)) {
    return "Black";
  }

  // Very light & desaturated -> White / Cream
  if (s <= 10 && v >= 82) {
    return "White";
  }
  if (s <= 18 && h >= 30 && h <= 55 && v >= 85) {
    return "Cream";
  }

  // Desaturated mid-tones -> Grey
  if (s <= 16 && v > 25 && v < 82) {
    return "Grey";
  }

  // Beige / Tan
  if (h >= 25 && h <= 50 && s >= 12 && s <= 35 && v >= 60) {
    return "Beige";
  }
  if (h >= 20 && h <= 45 && s >= 20 && s <= 45 && v >= 40 && v < 65) {
    return "Tan";
  }

  // Brown
  if (h >= 10 && h <= 40 && s >= 25 && v < 45) {
    return "Brown";
  }

  // Red (Hue wraps around 0/360)
  if ((h >= 345 || h <= 16) && s >= 22 && v >= 20) {
    if (v < 38 && s >= 30) return "Maroon";
    return "Red";
  }

  // Orange
  if (h > 16 && h <= 42 && s >= 35 && v >= 40) {
    return "Orange";
  }

  // Yellow / Mustard
  if (h > 42 && h <= 65 && s >= 25 && v >= 35) {
    if (v < 60 || s > 60) return "Mustard";
    return "Yellow";
  }

  // Green / Olive
  if (h > 65 && h <= 165 && s >= 18 && v >= 18) {
    if (h < 110 && v < 50) return "Olive";
    return "Green";
  }

  // Cyan / Teal
  if (h > 165 && h <= 195 && s >= 20 && v >= 20) {
    if (v < 55) return "Teal";
    return "Cyan";
  }

  // Blue / Navy
  if (h > 195 && h <= 255 && s >= 18 && v >= 18) {
    if (v < 38) return "Navy";
    return "Blue";
  }

  // Purple / Lavender
  if (h > 255 && h <= 310 && s >= 18 && v >= 18) {
    if (v >= 70 && s < 45) return "Lavender";
    return "Purple";
  }

  // Pink / Coral
  if (h > 310 && h < 345 && s >= 18 && v >= 35) {
    if (h < 330 && v > 60) return "Coral";
    return "Pink";
  }

  return "Black";
}

/**
 * Extract dominant clothing colors from an image using garment-region sampling
 */
export async function extractGarmentColors(
  imageSrc: string,
  contextHint?: string
): Promise<ColorExtractionResult> {
  // If text or hint contains explicit color, verify with vocabulary
  if (contextHint && contextHint.trim()) {
    const fromText = normalizeColor(contextHint);
    if (fromText.primary !== "Black" || contextHint.toLowerCase().includes("black")) {
      return {
        primaryColor: fromText.primary,
        secondaryColors: fromText.secondary || [],
        confidence: "high",
        detectedGarmentPalette: [fromText.primary, ...(fromText.secondary || [])],
      };
    }
  }

  // If in browser environment with Canvas available
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const result = await analyzeImageViaCanvas(imageSrc);
      if (result) return result;
    } catch (e) {
      console.warn("Canvas garment color analysis error, using fallback:", e);
    }
  }

  // Server-side / Node fallback based on image URL hints or normalization
  const normalized = normalizeColor(imageSrc);
  return {
    primaryColor: normalized.primary,
    secondaryColors: normalized.secondary || [],
    confidence: normalized.primary !== "Black" ? "medium" : "low",
    detectedGarmentPalette: [normalized.primary],
  };
}

/**
 * Browser Canvas-based pixel extraction for central garment region
 */
function analyzeImageViaCanvas(imageSrc: string): Promise<ColorExtractionResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        const size = 120;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;

        // Sample Garment Region:
        // Y: 25% to 80% (torso/clothing area, skipping upper head/hair and lower feet)
        // X: 15% to 85% (skipping far edges/background walls)
        const minX = Math.floor(size * 0.15);
        const maxX = Math.floor(size * 0.85);
        const minY = Math.floor(size * 0.25);
        const maxY = Math.floor(size * 0.82);

        const colorCounts: Record<ControlledColor, number> = {} as any;
        let totalGarmentPixels = 0;

        for (let y = minY; y < maxY; y++) {
          for (let x = minX; x < maxX; x++) {
            const idx = (y * size + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];

            if (a < 128) continue; // Transparent

            const hsv = rgbToHsv(r, g, b);

            // Skip skin tones (face, neck, arms)
            if (isLikelySkinTone(r, g, b, hsv)) {
              continue;
            }

            // Skip pure background highlights or extreme shadows
            if (hsv.v > 98 && hsv.s < 5) continue;
            if (hsv.v < 8) continue;

            const classified = classifyHsvPixel(hsv);
            colorCounts[classified] = (colorCounts[classified] || 0) + 1;
            totalGarmentPixels++;
          }
        }

        if (totalGarmentPixels === 0) {
          resolve(null);
          return;
        }

        // Sort colors by pixel frequency
        const sortedColors = (Object.keys(colorCounts) as ControlledColor[]).sort(
          (a, b) => (colorCounts[b] || 0) - (colorCounts[a] || 0)
        );

        const primary = sortedColors[0] || "Black";
        const primaryPercentage = (colorCounts[primary] || 0) / totalGarmentPixels;

        // Secondary colors if they represent >= 18% of garment pixels
        const secondary = sortedColors
          .slice(1)
          .filter((c) => (colorCounts[c] || 0) / totalGarmentPixels >= 0.18);

        const confidence: "high" | "medium" | "low" =
          primaryPercentage >= 0.45 ? "high" : primaryPercentage >= 0.25 ? "medium" : "low";

        resolve({
          primaryColor: primary,
          secondaryColors: secondary,
          confidence,
          detectedGarmentPalette: [primary, ...secondary],
        });
      } catch (err) {
        console.warn("Canvas sampling execution error:", err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageSrc;
  });
}

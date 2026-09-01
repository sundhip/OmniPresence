import {
  analyzePhotoAppearance,
  AppearanceAnalysisOutput,
} from "@/lib/appearanceAnalyzer";

export const appearanceAnalysisService = {
  /**
   * Analyzes an uploaded or captured user selfie/photo
   * Extracts Skin Tone (10-shade palette), Hair Profile (color, texture, length, current style), and Face Shape.
   */
  analyzePhoto: async (imageInput: string): Promise<AppearanceAnalysisOutput> => {
    // Artificial latency (600ms) for smooth scan feedback animation in UI
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!imageInput || imageInput.trim() === "") {
      throw new Error("No image data provided for appearance analysis.");
    }

    // If running in browser with Image element and is a base64 Data URL, attempt canvas pixel sampling
    if (
      typeof window !== "undefined" &&
      typeof Image !== "undefined" &&
      imageInput.startsWith("data:image")
    ) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // continue gracefully
          img.src = imageInput;
        });

        if (img.width > 0 && img.height > 0) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const w = 160;
            const h = 160;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            return analyzePhotoAppearance(imageInput, imgData.data, w, h);
          }
        }
      } catch (e) {
        console.warn("Canvas pixel extraction notice:", e);
      }
    }

    // Default analytical execution
    return analyzePhotoAppearance(imageInput);
  },
};

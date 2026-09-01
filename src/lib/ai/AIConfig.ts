/**
 * Centralized AI Model & Provider Configuration for OP AI
 * Enables flexible swapping of general-purpose, specialist, and offline models without rewriting application logic.
 */
export interface AIModelConfiguration {
  provider: "gemma" | "gemini" | "qwen" | "deterministic" | "auto";
  generalModel: string;
  reasoningModel: string;
  visionModel: string;
  fashionModel: string;
  embeddingModel: string;
  offlineModel: string;
  fashionClipServiceUrl: string;
}

export const AI_CONFIG: AIModelConfiguration = {
  provider: (process.env.AI_PROVIDER as any) || "auto",
  generalModel: process.env.AI_MODEL || "gemma-4",
  reasoningModel: process.env.AI_REASONING_MODEL || "gemma-4-26b-a4b",
  visionModel: process.env.AI_VISION_MODEL || "gemma-4",
  fashionModel: process.env.AI_FASHION_MODEL || "fashion-clip-v1",
  embeddingModel: process.env.AI_EMBEDDING_MODEL || "embedding-gemma",
  offlineModel: process.env.AI_OFFLINE_MODEL || "gemma-4-e4b",
  fashionClipServiceUrl: process.env.FASHION_CLIP_URL || "http://127.0.0.1:8000",
};

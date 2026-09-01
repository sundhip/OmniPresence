import {
  FashionModelProvider,
  FashionAnalysisInput,
  FashionAnalysisResult,
} from "@/lib/fashion/FashionModelProvider";
import { FashionCLIPProvider } from "@/lib/fashion/FashionCLIPProvider";
import { UserProfile } from "@/types/user";

class FashionAnalysisService {
  private provider: FashionModelProvider;

  constructor(provider?: FashionModelProvider) {
    this.provider = provider || new FashionCLIPProvider();
  }

  public setProvider(provider: FashionModelProvider) {
    this.provider = provider;
  }

  public async analyzeImage(
    imageSrc: string,
    userProfile?: UserProfile | null,
    manualContextText?: string
  ): Promise<FashionAnalysisResult> {
    if (!imageSrc || imageSrc.trim() === "") {
      throw new Error("Image input is required for fashion analysis.");
    }

    // Determine user profile size default
    let defaultSize = "M";
    if (userProfile?.sizes) {
      defaultSize = userProfile.sizes.tops || "M";
    }

    const input: FashionAnalysisInput = {
      image: imageSrc,
      contextHint: manualContextText,
      userProfileSize: defaultSize,
    };

    const result = await this.provider.analyzeImage(input);
    return result;
  }

  public async getHealth() {
    if (this.provider.checkHealth) {
      return await this.provider.checkHealth();
    }
    return { status: "ready", isReady: true };
  }
}

export const fashionAnalysisService = new FashionAnalysisService();

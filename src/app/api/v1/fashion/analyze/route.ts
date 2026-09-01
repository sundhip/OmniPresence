import { NextResponse } from "next/server";
import { fashionAnalysisService } from "@/services/fashionAnalysisService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, contextHint, userProfileSize } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    const result = await fashionAnalysisService.analyzeImage(image, null, contextHint);

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (err: any) {
    console.error("Fashion analysis route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to analyze fashion image" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const health = await fashionAnalysisService.getHealth();
  return NextResponse.json({
    provider: "FashionCLIP",
    model: "EMaghakyan/fashion-clip",
    status: health.status,
    isReady: health.isReady,
  });
}

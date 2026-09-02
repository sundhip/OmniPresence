import { NextResponse } from "next/server";
import { serpApiProvider } from "@/lib/marketplace/SerpApiProvider";
import { amazonMarketplaceProvider } from "@/lib/marketplace/AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "@/lib/marketplace/FlipkartMarketplaceProvider";

export async function GET() {
  return executeProviderDiagnostics();
}

export async function POST() {
  return executeProviderDiagnostics();
}

async function executeProviderDiagnostics() {
  try {
    const [serpApiResult, amazonResult, flipkartResult] = await Promise.all([
      serpApiProvider.testConnection(),
      amazonMarketplaceProvider.testConnection(),
      flipkartMarketplaceProvider.testConnection(),
    ]);

    const results = [serpApiResult, amazonResult, flipkartResult];
    const anyPassed = results.some((r) => r.passed);

    return NextResponse.json({
      success: true,
      data: {
        summary: anyPassed
          ? "At least one provider is connected and responding with live product data."
          : "No live external providers are connected. Check SERPAPI_API_KEY in .env.local.",
        anyConnected: anyPassed,
        results: {
          serpApi: serpApiResult,
          amazon: amazonResult,
          flipkart: flipkartResult,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute provider diagnostics" },
      { status: 500 }
    );
  }
}

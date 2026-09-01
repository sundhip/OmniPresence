import { NextResponse } from "next/server";
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
    const [amazonResult, flipkartResult] = await Promise.all([
      amazonMarketplaceProvider.testConnection(),
      flipkartMarketplaceProvider.testConnection(),
    ]);

    const results = [amazonResult, flipkartResult];
    const anyPassed = results.some((r) => r.passed);

    return NextResponse.json({
      success: true,
      data: {
        summary: anyPassed
          ? "At least one provider is connected and responding with live product data."
          : "No live providers are currently connected. Check credentials in .env.local.",
        anyConnected: anyPassed,
        results: {
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

import { NextResponse } from "next/server";
import { marketplaceAggregator } from "@/lib/marketplace/MarketplaceAggregator";

export async function GET() {
  try {
    const statuses = marketplaceAggregator.getProviderStatuses();
    const hasConnectedProviders = statuses.some((s) => s.isConfigured && s.isConnected);

    return NextResponse.json({
      success: true,
      data: {
        providers: statuses,
        hasConnectedProviders,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve provider status" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { FinancialEngine } from "@/lib/financialEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemQuery, price, category, color, wardrobe = [], plan = null } = body;

    if (!itemQuery || typeof price !== "number" || !category) {
      return NextResponse.json(
        { success: false, error: "itemQuery, price, and category are required" },
        { status: 400 }
      );
    }

    const evaluation = FinancialEngine.evaluatePurchaseNecessity(
      itemQuery,
      price,
      category,
      color,
      wardrobe,
      plan
    );

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate purchase" },
      { status: 500 }
    );
  }
}

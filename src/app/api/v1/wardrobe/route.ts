import { NextResponse } from "next/server";
import { INITIAL_WARDROBE_ITEMS } from "@/lib/seedData";

export async function GET(req: Request) {
  return NextResponse.json({
    success: true,
    items: INITIAL_WARDROBE_ITEMS,
  });
}

export async function POST(req: Request) {
  try {
    const itemData = await req.json();
    return NextResponse.json({
      success: true,
      item: {
        ...itemData,
        id: `item_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { INITIAL_OUTFITS } from "@/lib/seedData";

export async function GET() {
  return NextResponse.json({
    success: true,
    outfits: INITIAL_OUTFITS,
  });
}

export async function POST(req: Request) {
  try {
    const outfitData = await req.json();
    return NextResponse.json({
      success: true,
      outfit: {
        ...outfitData,
        id: `outfit_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

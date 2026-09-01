import { NextResponse } from "next/server";
import { INITIAL_USER } from "@/lib/seedData";

export async function GET() {
  return NextResponse.json({
    success: true,
    profile: INITIAL_USER,
  });
}

export async function PATCH(req: Request) {
  try {
    const updates = await req.json();
    return NextResponse.json({
      success: true,
      profile: {
        ...INITIAL_USER,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

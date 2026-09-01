import { NextResponse } from "next/server";
import { EventItem } from "@/types/events";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_alex_mercer";

    return NextResponse.json({
      success: true,
      message: "Events API endpoint operational",
      userId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      data: body,
      message: "Event processed successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process event" },
      { status: 500 }
    );
  }
}

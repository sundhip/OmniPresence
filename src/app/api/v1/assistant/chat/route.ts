import { NextResponse } from "next/server";
import { AssistantEngine } from "@/lib/assistantEngine";
import { AssistantQueryContext } from "@/types/assistant";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    const safeContext: AssistantQueryContext = context || {
      user: null,
      events: [],
      wardrobe: [],
      weather: null,
      financialPlan: null,
      reminders: [],
    };

    const response = await AssistantEngine.generateResponse(query, safeContext);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process assistant query" },
      { status: 500 }
    );
  }
}

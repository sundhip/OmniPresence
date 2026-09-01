import { NextResponse } from "next/server";
import { OPTools } from "@/lib/ai/OPTools";
import { PendingAction } from "@/types/assistant";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action } = body as { userId: string; action: PendingAction };

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "userId and action are required" },
        { status: 400 }
      );
    }

    let result: any = null;

    if (action.type === "create_transaction") {
      result = await OPTools.createTransaction(userId, {
        title: action.payload.txTitle || "Expense",
        amount: action.payload.amount || 0,
        category: action.payload.category || "Other",
      });
    } else if (action.type === "create_reminder") {
      result = await OPTools.createReminder(userId, {
        title: action.payload.reminderTitle || "Reminder",
        time: action.payload.reminderTime || "09:00",
        date: action.payload.reminderDate,
        type: action.payload.reminderType || "custom",
      });
    } else if (action.type === "create_event") {
      result = await OPTools.createCalendarEvent(userId, {
        title: action.payload.eventTitle || "Event",
        date: action.payload.eventDate || new Date().toISOString().split("T")[0],
        time: action.payload.eventTime || "10:00",
        location: action.payload.eventLocation || "Venue",
      });
    } else if (action.type === "mark_worn") {
      if (action.payload.itemId) {
        result = await OPTools.markItemWorn(userId, action.payload.itemId);
      }
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported action type: ${action.type}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      actionId: action.id,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}

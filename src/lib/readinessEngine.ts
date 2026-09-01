import { EventItem, EventReadiness, ReadinessFactor, ReadinessStatus } from "@/types/events";
import { WardrobeItem } from "@/types/wardrobe";
import { ReminderItem } from "@/types/reminders";

export class ReadinessEngine {
  /**
   * Evaluates event readiness across 7 core dimensions with explainable scoring
   */
  public static calculateEventReadiness(
    event: EventItem,
    wardrobe: WardrobeItem[] = [],
    reminders: ReminderItem[] = []
  ): EventReadiness {
    const checklist = new Set(event.completedChecklist || []);

    const hasOutfit = Boolean(
      event.plannedOutfit?.topItemId ||
        event.plannedOutfit?.topItemName ||
        checklist.has("outfit_selected")
    );

    const hasFootwear = Boolean(
      event.plannedOutfit?.shoesItemId ||
        event.plannedOutfit?.shoesItemName ||
        checklist.has("footwear_selected")
    );

    const hasAccessories = Boolean(
      (event.plannedOutfit?.accessoryIds && event.plannedOutfit.accessoryIds.length > 0) ||
        (event.plannedOutfit?.accessoryNames && event.plannedOutfit.accessoryNames.length > 0) ||
        checklist.has("accessories_prepared")
    );

    const hasTransit = Boolean(
      event.selectedTransitMode || checklist.has("transit_planned")
    );

    const hasWeatherChecked = Boolean(
      checklist.has("weather_checked") || event.dressCode
    );

    const hasReminders = Boolean(
      reminders.some((r) => r.eventId === event.id) || checklist.has("reminders_created")
    );

    const hasConfirmedDetails = Boolean(
      event.title && event.date && event.time && event.location
    );

    const factors: ReadinessFactor[] = [
      {
        id: "event_confirmed",
        label: "Event Time & Venue Confirmed",
        completed: hasConfirmedDetails,
        weight: 15,
        actionPrompt: "Verify date, time, and venue address.",
      },
      {
        id: "outfit_selected",
        label: "Outfit Planned & Approved",
        completed: hasOutfit,
        weight: 25,
        actionPrompt: "Select an outfit from your digital wardrobe.",
      },
      {
        id: "footwear_selected",
        label: "Matching Footwear Selected",
        completed: hasFootwear,
        weight: 15,
        actionPrompt: "Pair matching footwear with your outfit.",
      },
      {
        id: "transportation_planned",
        label: "Transportation & Departure Time Planned",
        completed: hasTransit,
        weight: 15,
        actionPrompt: "Choose fastest transit route and note departure time.",
      },
      {
        id: "weather_checked",
        label: "Weather & Temperature Checked",
        completed: hasWeatherChecked,
        weight: 10,
        actionPrompt: "Verify forecast for fabric suitability.",
      },
      {
        id: "reminders_created",
        label: "Preparation & Departure Reminders Set",
        completed: hasReminders,
        weight: 10,
        actionPrompt: "Add timeline preparation reminders.",
      },
      {
        id: "accessories_prepared",
        label: "Accessories & Grooming Prepared",
        completed: hasAccessories,
        weight: 10,
        actionPrompt: "Select accessories or watch.",
      },
    ];

    // Compute aggregate score
    const totalScore = factors.reduce((acc, f) => (f.completed ? acc + f.weight : acc), 0);
    const score = Math.min(100, Math.max(0, totalScore));

    let status: ReadinessStatus = "NEEDS PREPARATION";
    if (score >= 85) {
      status = "READY";
    } else if (score >= 60) {
      status = "ALMOST READY";
    }

    // Identify missing items
    const missing = factors.filter((f) => !f.completed).map((f) => f.label);

    let summary = "";
    let nextAction = "";

    if (status === "READY") {
      summary = `You're completely ready for ${event.title}! Outfit, transit, and schedule are all locked in.`;
    } else if (status === "ALMOST READY") {
      if (!hasTransit) {
        summary = "Your outfit is ready, but transportation has not been planned yet.";
        nextAction = "Select a transit mode to lock in your departure time.";
      } else if (!hasOutfit) {
        summary = "Transit is mapped, but your outfit is still pending selection.";
        nextAction = "Select a matching outfit from your wardrobe.";
      } else {
        summary = "You're nearly prepared with a few remaining checklist items.";
        nextAction = `Complete: ${missing[0] || "checklist"}`;
      }
    } else {
      summary = "Preparation is pending across multiple checklist items for this event.";
      nextAction = "Start by confirming your planned outfit and travel options.";
    }

    return {
      score,
      status,
      summary,
      factors,
      missingItems: missing,
      nextAction,
    };
  }
}

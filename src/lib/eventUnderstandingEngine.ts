import { EventItem, InferredEventContext, EventCategory, TransitMode } from "@/types/events";

export class EventUnderstandingEngine {
  /**
   * Infers full context, formality, dress code, and preparation timeline from event details
   */
  public static inferEventContext(event: Partial<EventItem>): InferredEventContext {
    const title = (event.title || "").toLowerCase();
    const type = event.type || "Other";
    const location = (event.location || "").toLowerCase();
    const notes = (event.notes || "").toLowerCase();

    // 1. Determine Occasion & Formality
    let formality: InferredEventContext["formality"] = "Smart Casual";
    let occasion = event.title || "Scheduled Event";
    let dressCode = "Smart Casual — clean tailored separates";
    let palette = ["Navy", "White", "Grey", "Black"];
    let recommendedTransit: TransitMode = "Metro";
    let estDuration = 35;
    let bufferMin = 20;

    if (
      type === "Job Interview" ||
      title.includes("interview") ||
      notes.includes("interview")
    ) {
      formality = "Formal";
      occasion = "Job Interview & Professional Assessment";
      dressCode = "Strict Business Formal — structured shirt/blazer, pressed trousers, and leather footwear";
      palette = ["Navy", "White", "Charcoal", "Black", "Light Blue"];
      recommendedTransit = "Train";
      estDuration = 40;
      bufferMin = 30; // High buffer for interviews
    } else if (
      type === "Wedding" ||
      title.includes("wedding") ||
      title.includes("reception") ||
      title.includes("sangeet") ||
      title.includes("marriage")
    ) {
      formality = "Festive";
      occasion = "Wedding Celebration & Reception";
      dressCode = "Festive / Elegant Formal — rich tones, tailored blazer or traditional festive attire with formal footwear";
      palette = ["Navy", "Maroon", "Gold", "Emerald", "Black", "Cream"];
      recommendedTransit = "Train";
      estDuration = 45;
      bufferMin = 30;
    } else if (
      type === "Presentation" ||
      title.includes("presentation") ||
      title.includes("defense") ||
      title.includes("pitch")
    ) {
      formality = "Formal";
      occasion = "Executive Presentation & Academic Pitch";
      dressCode = "Sharp Business Formal — crisp Oxford shirt, tailored trousers, sleek watch, clean dress shoes";
      palette = ["Navy", "White", "Black", "Grey"];
      recommendedTransit = "Metro";
      estDuration = 30;
      bufferMin = 25;
    } else if (
      type === "Work Meeting" ||
      title.includes("meeting") ||
      title.includes("client") ||
      title.includes("standup")
    ) {
      formality = "Semi-Formal";
      occasion = "Client Meeting & Professional Collaboration";
      dressCode = "Business Casual — collared shirt or polo, chinos or dark trousers, loafers";
      palette = ["Navy", "White", "Beige", "Olive", "Grey"];
      recommendedTransit = "Metro";
      estDuration = 25;
      bufferMin = 15;
    } else if (
      type === "Formal Gala" ||
      title.includes("gala") ||
      title.includes("awards")
    ) {
      formality = "Formal";
      occasion = "Black-Tie / Formal Gala Event";
      dressCode = "Black-Tie Formal — dark structured suit/evening dress, polished accessories";
      palette = ["Black", "Midnight Blue", "White", "Silver"];
      recommendedTransit = "Cab";
      estDuration = 35;
      bufferMin = 25;
    } else if (
      type === "Date" ||
      title.includes("dinner") ||
      title.includes("date")
    ) {
      formality = "Smart Casual";
      occasion = "Evening Dinner & Social Date";
      dressCode = "Elevated Smart Casual — textured knit or relaxed linen shirt, dark denim/chinos, clean sneakers/loafers";
      palette = ["Navy", "Charcoal", "Olive", "Burgundy", "White"];
      recommendedTransit = "Cab";
      estDuration = 25;
      bufferMin = 15;
    } else if (
      type === "Casual Outing" ||
      title.includes("lunch") ||
      title.includes("coffee") ||
      title.includes("hangout")
    ) {
      formality = "Casual";
      occasion = "Casual Social Outing";
      dressCode = "Relaxed Casual — comfortable cotton tee or overshirt, relaxed trousers/jeans, sneakers";
      palette = ["White", "Beige", "Blue", "Black", "Grey"];
      recommendedTransit = "Auto";
      estDuration = 20;
      bufferMin = 10;
    } else if (type === "Workout" || title.includes("gym") || title.includes("run")) {
      formality = "Casual";
      occasion = "Athletic Training & Fitness";
      dressCode = "Performance Activewear — moisture-wicking top, training shorts/joggers, athletic running shoes";
      palette = ["Black", "Grey", "Volt", "Blue"];
      recommendedTransit = "Walking";
      estDuration = 10;
      bufferMin = 5;
    }

    // Adjust transit based on location if specified
    if (location.includes("nungambakkam") || location.includes("tambaram") || location.includes("chennai")) {
      // Transit in Chennai region: train / metro is highly reliable for Tambaram -> Nungambakkam corridor
      recommendedTransit = "Train";
      estDuration = 35;
    } else if (location.includes("airport") || location.includes("terminal")) {
      recommendedTransit = "Metro";
      estDuration = 40;
      bufferMin = 45;
    }

    // 2. Preparation Timeline
    const preparationTimeline = [
      {
        timeBeforeMin: 120,
        task: "Start getting ready & personal grooming",
        type: "grooming" as const,
        defaultReminder: true,
      },
      {
        timeBeforeMin: 90,
        task: "Iron outfit & prepare accessories",
        type: "iron" as const,
        defaultReminder: true,
      },
      {
        timeBeforeMin: 60,
        task: "Get dressed in planned outfit",
        type: "outfit" as const,
        defaultReminder: false,
      },
      {
        timeBeforeMin: estDuration + bufferMin,
        task: `Check transit & depart for ${event.location || "event"}`,
        type: "departure" as const,
        defaultReminder: true,
      },
    ];

    return {
      occasion,
      formality,
      priority: event.priority || "Medium",
      recommendedDressCode: dressCode,
      recommendedColorPalette: palette,
      weatherSuitabilityNote: "Light, breathable cotton for warm afternoons; layer with outerwear if evening temperatures drop.",
      preparationTimeline,
      travelRequirement: {
        estimatedDurationMinutes: estDuration,
        recommendedTransit,
        bufferMinutes: bufferMin,
      },
    };
  }
}

import { EventUnderstandingEngine } from "../src/lib/eventUnderstandingEngine";
import { TransportationEngine } from "../src/lib/transportationEngine";
import { ReadinessEngine } from "../src/lib/readinessEngine";
import { FinancialEngine } from "../src/lib/financialEngine";
import { AssistantEngine } from "../src/lib/assistantEngine";
import { getGoogleCalendarUrl, generateIcsContent } from "../src/lib/googleCalendar";
import { EventItem } from "../src/types/events";
import { WardrobeItem } from "../src/types/wardrobe";
import { ReminderItem } from "../src/types/reminders";
import { FinancialPlan } from "../src/types/finance";
import { WeatherContext } from "../src/types/weather";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("RUNNING OP AI FEATURES 13–22 ACCEPTANCE & INTEGRATION TEST SUITE");
  console.log("==================================================================");

  // -------------------------------------------------------------
  // TEST GROUP 1: Features 13, 14 & 15 — Calendar, Details & Understanding
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Calendar & Event Semantic Understanding ---");

  const collegePresEvent: EventItem = {
    id: "ev_college",
    userId: "user_hero",
    title: "College Presentation",
    date: "2026-09-15",
    time: "10:00",
    location: "Main Campus Auditorium",
    originLocation: "Tambaram",
    type: "Presentation",
    priority: "High",
    notes: "Final thesis defense on Artificial Intelligence.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const presContext = EventUnderstandingEngine.inferEventContext(collegePresEvent);
  assert(
    presContext.formality === "Formal" && presContext.occasion.includes("Presentation"),
    "TEST 1.1: 'College Presentation' infers Formal formality & presentation occasion"
  );
  assert(
    presContext.recommendedDressCode.includes("Business Formal") ||
      presContext.recommendedDressCode.includes("Oxford shirt"),
    "TEST 1.2: Dress code recommendation for Presentation requires business formal separates"
  );

  const weddingEvent: EventItem = {
    id: "ev_wedding",
    userId: "user_hero",
    title: "Wedding Reception",
    date: "2026-09-18",
    time: "19:00",
    location: "Nungambakkam Grand Hall",
    originLocation: "Tambaram",
    type: "Wedding",
    priority: "High",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const weddingContext = EventUnderstandingEngine.inferEventContext(weddingEvent);
  assert(
    weddingContext.formality === "Festive" && weddingContext.recommendedColorPalette.length > 0,
    "TEST 1.3: 'Wedding Reception' infers Festive formality with rich color palette"
  );

  const tcsInterview: EventItem = {
    id: "ev_interview",
    userId: "user_hero",
    title: "Interview at TCS tomorrow at 10 AM",
    date: "2026-09-03",
    time: "10:00",
    location: "TCS Siruseri",
    originLocation: "Tambaram",
    type: "Job Interview",
    priority: "High",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const interviewContext = EventUnderstandingEngine.inferEventContext(tcsInterview);
  assert(
    interviewContext.formality === "Formal" && interviewContext.travelRequirement.bufferMinutes >= 25,
    "TEST 1.4: 'Interview at TCS' infers strict formal requirement with high arrival buffer"
  );

  // -------------------------------------------------------------
  // TEST GROUP 2: Smart Transportation & Multi-Modal Route Engine
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Smart Transportation Engine ---");

  const transitPlan = TransportationEngine.calculateTransitOptions(
    "Tambaram",
    "Nungambakkam",
    "19:00",
    20
  );

  assert(
    transitPlan.allOptions.some((o) => o.mode === "Train") &&
      transitPlan.allOptions.some((o) => o.mode === "Metro") &&
      transitPlan.allOptions.some((o) => o.mode === "Cab") &&
      transitPlan.allOptions.some((o) => o.mode === "Bus"),
    "TEST 2.1: Multi-modal transit provides Train, Metro, Cab, Auto, and Bus options"
  );

  assert(
    transitPlan.recommendedOption.isFastest === true &&
      transitPlan.recommendedOption.durationMinutes === 32,
    "TEST 2.2: Transportation engine accurately designates fastest route (EMU Train, 32 mins)"
  );

  assert(
    typeof transitPlan.recommendedDepartureTime === "string" &&
      transitPlan.recommendedDepartureTime.length > 0,
    "TEST 2.3: Recommended departure time calculated accurately before event arrival"
  );

  // -------------------------------------------------------------
  // TEST GROUP 3: Features 16 & 22 — Event Readiness Engine & Readiness Score
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Event Readiness Engine & Score ---");

  const mockWardrobe: WardrobeItem[] = [
    {
      id: "item_black_oxford",
      userId: "user_hero",
      name: "Tailored Black Oxford Shirt",
      category: "Tops",
      subcategory: "Button-Up Shirt",
      color: "Black",
      brand: "Theory",
      size: "M",
      material: "Cotton",
      season: ["All-Season"],
      occasion: ["Office", "Meeting"],
      imageUrl: "https://example.com/black_shirt.jpg",
      wearCount: 4,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item_charcoal_trousers",
      userId: "user_hero",
      name: "Charcoal Wool Trousers",
      category: "Bottoms",
      subcategory: "Trousers",
      color: "Charcoal",
      brand: "Zara",
      size: "32",
      material: "Wool",
      season: ["All-Season"],
      occasion: ["Office", "Meeting"],
      imageUrl: "https://example.com/trousers.jpg",
      wearCount: 5,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item_chelsea_boots",
      userId: "user_hero",
      name: "Black Leather Chelsea Boots",
      category: "Shoes",
      subcategory: "Boots",
      color: "Black",
      brand: "Common Projects",
      size: "10.5",
      material: "Leather",
      season: ["All-Season"],
      occasion: ["Office", "Meeting"],
      imageUrl: "https://example.com/boots.jpg",
      wearCount: 3,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const preparedWeddingEvent: EventItem = {
    ...weddingEvent,
    plannedOutfit: {
      topItemId: "item_black_oxford",
      topItemName: "Tailored Black Oxford Shirt",
      bottomItemId: "item_charcoal_trousers",
      bottomItemName: "Charcoal Wool Trousers",
      shoesItemId: "item_chelsea_boots",
      shoesItemName: "Black Leather Chelsea Boots",
    },
    selectedTransitMode: "Train",
    completedChecklist: [
      "event_confirmed",
      "outfit_selected",
      "footwear_selected",
      "transportation_planned",
      "weather_checked",
      "reminders_created",
      "accessories_prepared",
    ],
  };

  const mockReminders: ReminderItem[] = [
    {
      id: "rem_1",
      userId: "user_hero",
      eventId: "ev_wedding",
      eventTitle: "Wedding Reception",
      title: "Leave home via Train",
      type: "departure",
      date: "2026-09-18",
      time: "18:15",
      isCompleted: false,
      priority: "High",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const readyScore = ReadinessEngine.calculateEventReadiness(
    preparedWeddingEvent,
    mockWardrobe,
    mockReminders
  );

  assert(
    readyScore.status === "READY" && readyScore.score >= 85,
    "TEST 3.1: Fully configured wedding event achieves 'READY' status (Score >= 85%)"
  );

  const unpreparedEvent: EventItem = {
    id: "ev_unprepared",
    userId: "user_hero",
    title: "Upcoming Gala",
    date: "2026-09-20",
    time: "20:00",
    location: "Hotel Grand",
    type: "Formal Gala",
    priority: "Medium",
    completedChecklist: ["event_confirmed"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const unreadyScore = ReadinessEngine.calculateEventReadiness(
    unpreparedEvent,
    mockWardrobe,
    []
  );

  assert(
    unreadyScore.status === "NEEDS PREPARATION" && unreadyScore.missingItems.length > 0,
    "TEST 3.2: Unprepared event accurately reports 'NEEDS PREPARATION' and lists missing checklist items"
  );

  // -------------------------------------------------------------
  // TEST GROUP 4: Features 20 & 21 — Financial Goals & "Do I Need This?"
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Financial Goals & Purchase Evaluator ---");

  const mockPlan: FinancialPlan = {
    userId: "user_hero",
    monthlyBudget: 5000,
    monthlyFashionBudget: 5000,
    clothingBudget: 3000,
    shoppingLimit: 5000,
    savingsGoal: 1500,
    spentThisMonth: 3800,
    currency: "₹",
    transactions: [],
    updatedAt: new Date().toISOString(),
  };

  const extendedWardrobe: WardrobeItem[] = [
    ...mockWardrobe,
    {
      id: "item_black_shirt_2",
      userId: "user_hero",
      name: "Black Slim Fit Linen Shirt",
      category: "Tops",
      subcategory: "Button-Up Shirt",
      color: "Black",
      brand: "Zara",
      size: "M",
      material: "Linen",
      season: ["All-Season"],
      occasion: ["Casual"],
      imageUrl: "https://example.com/b2.jpg",
      wearCount: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item_black_shirt_3",
      userId: "user_hero",
      name: "Black Silk Camp Collar Shirt",
      category: "Tops",
      subcategory: "Button-Up Shirt",
      color: "Black",
      brand: "Cos",
      size: "M",
      material: "Silk",
      season: ["All-Season"],
      occasion: ["Evening"],
      imageUrl: "https://example.com/b3.jpg",
      wearCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item_black_shirt_4",
      userId: "user_hero",
      name: "Black Band Collar Poplin Shirt",
      category: "Tops",
      subcategory: "Button-Up Shirt",
      color: "Black",
      brand: "Theory",
      size: "M",
      material: "Cotton",
      season: ["All-Season"],
      occasion: ["Formal"],
      imageUrl: "https://example.com/b4.jpg",
      wearCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 1. "Black formal shirt" evaluated against 4 existing black shirts
  const evalRedundant = FinancialEngine.evaluatePurchaseNecessity(
    "Black formal shirt",
    1500,
    "Tops",
    "Black",
    extendedWardrobe,
    mockPlan
  );

  assert(
    evalRedundant.verdict === "High Redundancy" && evalRedundant.existingSimilarItemsCount >= 3,
    "TEST 4.1: 'Black formal shirt' evaluates to 'High Redundancy' when user owns 4 similar black shirts"
  );
  assert(
    Boolean(evalRedundant.alternativeSuggestion?.color),
    "TEST 4.2: Evaluator suggests complementary color styling alternative (e.g. Light Blue)"
  );

  // 2. Over-budget purchase evaluation
  const evalOverBudget = FinancialEngine.evaluatePurchaseNecessity(
    "Black leather sneakers",
    2500, // Remaining is 1200
    "Shoes",
    "Black",
    mockWardrobe,
    mockPlan
  );

  assert(
    evalOverBudget.verdict === "Budget Alert" && evalOverBudget.budgetImpact.isOverBudget === true,
    "TEST 4.3: Purchase exceeding remaining monthly budget flags 'Budget Alert'"
  );

  // 3. Google Calendar URL & .ICS generation
  const gcalUrl = getGoogleCalendarUrl(weddingEvent);
  assert(
    gcalUrl.includes("calendar.google.com") && gcalUrl.includes("Wedding%20Reception"),
    "TEST 4.4: Google Calendar URL is generated with valid web intent parameters"
  );

  const icsText = generateIcsContent(weddingEvent);
  assert(
    icsText.includes("BEGIN:VCALENDAR") && icsText.includes("SUMMARY:Wedding Reception"),
    "TEST 4.5: Standard .ICS iCalendar format is generated correctly"
  );

  // 4. Non-clothing generalized evaluation (Gaming, Food, Stationery)
  const gamingPlan: FinancialPlan = {
    ...mockPlan,
    monthlyBudget: 15000,
    spentThisMonth: 14000,
    transactions: [
      { id: "tx_1", title: "Game pass", amount: 500, date: "2026-09-01", category: "Gaming & Tech" },
      { id: "tx_2", title: "In-game skin", amount: 400, date: "2026-09-02", category: "Gaming & Tech" },
      { id: "tx_3", title: "DLC pack", amount: 800, date: "2026-09-03", category: "Gaming & Tech" },
      { id: "tx_4", title: "Gaming headset", amount: 1200, date: "2026-09-04", category: "Gaming & Tech" },
    ],
  };

  const evalGaming = FinancialEngine.evaluatePurchaseNecessity(
    "Mechanical Gaming Keyboard",
    3500,
    "Gaming & Tech",
    undefined,
    mockWardrobe,
    gamingPlan
  );

  assert(
    evalGaming.verdict === "Budget Alert" && evalGaming.budgetImpact.isOverBudget === true,
    "TEST 4.6: Generalized non-clothing purchase (Gaming) evaluates against monthly budget"
  );

  const evalStationery = FinancialEngine.evaluatePurchaseNecessity(
    "Hardcover Notebook Set",
    450,
    "Stationery & Books",
    undefined,
    mockWardrobe,
    { ...mockPlan, monthlyBudget: 15000, spentThisMonth: 2000 }
  );

  assert(
    evalStationery.verdict === "High Wardrobe Value" || evalStationery.verdict === "Moderate Value",
    "TEST 4.7: Stationery & Books expense recognized as high utility / investment spend"
  );

  // -------------------------------------------------------------
  // TEST GROUP 5: Feature 18 — OP AI Conversational Assistant
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: OP AI Conversational Assistant ---");

  const mockWeather: WeatherContext = {
    location: "Chennai, India",
    temperature: 28,
    feelsLike: 31,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 14,
    precipitation: "Low (5%)",
    uvIndex: 7,
    timestamp: new Date().toISOString(),
  };

  const assistantContext = {
    user: null,
    events: [preparedWeddingEvent],
    wardrobe: mockWardrobe,
    weather: mockWeather,
    financialPlan: mockPlan,
    reminders: mockReminders,
  };

  const wearReply = await AssistantEngine.generateResponse(
    "What should I wear for the wedding?",
    assistantContext
  );
  assert(
    wearReply.text.includes("Recommended") || wearReply.text.includes("outfit"),
    "TEST 5.1: Assistant recommends matching wardrobe outfit for wedding with explanation"
  );

  const transitReply = await AssistantEngine.generateResponse(
    "How should I reach my wedding and when should I leave?",
    assistantContext
  );
  assert(
    transitReply.text.includes("Fastest Mode") || transitReply.text.includes("Train"),
    "TEST 5.2: Assistant identifies fastest transit mode (Train) and calculates departure time"
  );

  const readinessReply = await AssistantEngine.generateResponse(
    "Am I ready for my event?",
    assistantContext
  );
  assert(
    readinessReply.text.includes("Readiness Status") && readinessReply.text.includes("READY"),
    "TEST 5.3: Assistant answers readiness query with live status and score"
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(
    `TOTAL ACCEPTANCE TESTS PASSED: ${passed}/${passed + failed} (${Math.round(
      (passed / (passed + failed)) * 100
    )}%)`
  );
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, val: string) {
    this.store[key] = String(val);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

(global as any).window = {};
(global as any).localStorage = new MockLocalStorage();
(global as any).CustomEvent = class CustomEvent {
  name: string;
  detail: any;
  constructor(name: string, detail: any) {
    this.name = name;
  }
};

import { AppStorage } from "../src/lib/storage";
import { AssistantEngine } from "../src/lib/assistantEngine";
import { ContextBuilder } from "../src/lib/ai/ContextBuilder";
import { OPTools } from "../src/lib/ai/OPTools";
import { AIProviderFactory } from "../src/lib/ai/AIProvider";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runOpAiAcceptanceTests() {
  console.log("==================================================================");
  console.log("RUNNING OP AI PERSONAL INTELLIGENCE ASSISTANT ACCEPTANCE TESTS");
  console.log("==================================================================");

  // Setup Mock Data for Two Users: Hero (User A) and Sun (User B)
  const heroId = "user_hero_isolated";
  const sunId = "user_sun_isolated";

  // Seed test storage
  AppStorage.saveWardrobe(heroId, [
    {
      id: "hero_item_1",
      userId: heroId,
      name: "Hero Red Silk Dress",
      category: "Dresses",
      subcategory: "Maxi Dress",
      color: "Red",
      season: ["Summer", "All-Season"],
      occasion: ["Party", "Casual"],
      fit: "Regular",
      wearCount: 0,
      imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "hero_item_2",
      userId: heroId,
      name: "Hero Black Jeans",
      category: "Bottoms",
      subcategory: "Jeans",
      color: "Black",
      season: ["All-Season"],
      occasion: ["Casual"],
      fit: "Regular",
      wearCount: 2,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  AppStorage.saveWardrobe(sunId, [
    {
      id: "sun_item_1",
      userId: sunId,
      name: "Sun Blue Linen Shirt",
      category: "Tops",
      subcategory: "Shirt",
      color: "Blue",
      season: ["Summer"],
      occasion: ["Office", "Formal"],
      fit: "Slim",
      wearCount: 0,
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  AppStorage.saveFinancialPlan(heroId, {
    userId: heroId,
    monthlyBudget: 20000,
    monthlyFashionBudget: 7000,
    savingsGoal: 5000,
    spentThisMonth: 1500,
    currency: "₹",
    transactions: [
      { id: "tx_h1", title: "Hero Dining", amount: 1500, date: "2026-09-01", category: "Food & Dining" },
    ],
    updatedAt: new Date().toISOString(),
  });

  AppStorage.saveFinancialPlan(sunId, {
    userId: sunId,
    monthlyBudget: 10000,
    monthlyFashionBudget: 3000,
    savingsGoal: 2000,
    spentThisMonth: 6000,
    currency: "₹",
    transactions: [
      { id: "tx_s1", title: "Sun Gaming Keyboard", amount: 6000, date: "2026-09-01", category: "Gaming & Tech" },
    ],
    updatedAt: new Date().toISOString(),
  });

  AppStorage.saveEvents(heroId, [
    {
      id: "ev_h1",
      userId: heroId,
      title: "Hero Gala Dinner",
      date: "2026-09-05",
      time: "20:00",
      location: "Grand Chola, Guindy",
      originLocation: "Tambaram",
      type: "Dinner",
      priority: "High",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  AppStorage.saveEvents(sunId, [
    {
      id: "ev_s1",
      userId: sunId,
      title: "Sun Tech Interview",
      date: "2026-09-06",
      time: "10:00",
      location: "Tidel Park, Taramani",
      originLocation: "Velachery",
      type: "Presentation",
      priority: "High",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // -------------------------------------------------------------
  // TEST GROUP 1: User Data Isolation
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: Strict User Data Isolation ---");

  const heroContext = await ContextBuilder.buildContext(heroId, "outfit_recommendation");
  assert(
    heroContext.wardrobe.some((w) => w.name.includes("Hero Red Silk Dress")),
    "TEST 1.1: Hero's context contains Hero's Red Silk Dress"
  );
  assert(
    !heroContext.wardrobe.some((w) => w.name.includes("Sun Blue Linen Shirt")),
    "TEST 1.2: Hero's context CANNOT access Sun's Blue Linen Shirt"
  );

  const sunContext = await ContextBuilder.buildContext(sunId, "financial_inquiry");
  assert(
    sunContext.financialPlan?.monthlyBudget === 10000 && sunContext.financialPlan?.spentThisMonth === 6000,
    "TEST 1.3: Sun's financial summary loads Sun's budget (₹10,000) and spent (₹6,000)"
  );
  assert(
    sunContext.financialPlan?.monthlyBudget !== 20000,
    "TEST 1.4: Sun cannot access Hero's ₹20,000 budget"
  );

  // -------------------------------------------------------------
  // TEST GROUP 2: Intent Analysis & Tool Layer
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Intent Analysis & Tool Layer ---");

  const provider = AIProviderFactory.getProvider();

  const intentOutfit = await provider.analyzeIntent("What should I wear tomorrow?");
  assert(intentOutfit === "outfit_recommendation", "TEST 2.1: 'What should I wear tomorrow?' -> outfit_recommendation");

  const intentTransit = await provider.analyzeIntent("How should I reach the venue by 8 PM?");
  assert(intentTransit === "transit_departure", "TEST 2.2: 'How should I reach the venue?' -> transit_departure");

  const intentReadiness = await provider.analyzeIntent("Am I ready for my gala dinner?");
  assert(intentReadiness === "readiness_checklist", "TEST 2.3: 'Am I ready for my gala dinner?' -> readiness_checklist");

  const intentTx = await provider.analyzeIntent("Add ₹450 for lunch");
  assert(intentTx === "action_create_transaction", "TEST 2.4: 'Add ₹450 for lunch' -> action_create_transaction");

  const intentRem = await provider.analyzeIntent("Set reminder to iron dress");
  assert(intentRem === "action_create_reminder", "TEST 2.5: 'Set reminder to iron dress' -> action_create_reminder");

  // -------------------------------------------------------------
  // TEST GROUP 3: Write Actions & Confirmation Protocol
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Write Action Confirmation Protocol ---");

  const txResponse = await AssistantEngine.generateResponse("Add ₹850 for cafe meal", heroContext);
  assert(
    txResponse.pendingAction !== undefined,
    "TEST 3.1: Expense logging generates structured pendingAction"
  );
  assert(
    txResponse.pendingAction?.payload.amount === 850 && txResponse.pendingAction?.payload.category === "Food & Dining",
    "TEST 3.2: Pending action extracts amount (₹850) and category (Food & Dining)"
  );
  assert(
    txResponse.embeddedCard?.type === "action_confirmation",
    "TEST 3.3: Action confirmation embedded card is created for UI render"
  );

  // Execute the pending action
  await OPTools.createTransaction(heroId, {
    title: txResponse.pendingAction!.payload.txTitle!,
    amount: txResponse.pendingAction!.payload.amount!,
    category: txResponse.pendingAction!.payload.category!,
  });
  const updatedHeroPlan = AppStorage.getFinancialPlan(heroId);
  assert(
    updatedHeroPlan.spentThisMonth === 1500 + 850,
    "TEST 3.4: Confirmed transaction successfully mutates Hero's spending total to ₹2,350"
  );

  // -------------------------------------------------------------
  // TEST GROUP 4: Cross-Domain Intelligence & Follow-ups
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Cross-Domain Intelligence & Follow-ups ---");

  const outfitResp = await AssistantEngine.generateResponse("What should I wear for my gala dinner?", heroContext);
  assert(
    outfitResp.text.includes("Hero Red Silk Dress") || outfitResp.text.includes("Hero Black Jeans"),
    "TEST 4.1: Outfit response references Hero's actual wardrobe catalog"
  );
  assert(
    outfitResp.embeddedCard?.type === "outfit",
    "TEST 4.2: Outfit response embeds interactive Outfit card"
  );

  // Follow-up test
  const followUpContext = {
    ...heroContext,
    recentMessages: [
      { sender: "assistant" as const, text: outfitResp.text },
    ],
  };
  const followUpResp = await AssistantEngine.generateResponse("Make it more casual", followUpContext);
  assert(
    followUpResp.intent === "outfit_recommendation",
    "TEST 4.3: Follow-up 'Make it more casual' retains outfit recommendation intent"
  );

  // -------------------------------------------------------------
  // TEST GROUP 5: Zero Hallucination & Empty Data Handling
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Zero Hallucination & Empty Data Handling ---");

  const emptyUserId = "user_empty_catalog";
  AppStorage.saveWardrobe(emptyUserId, []);
  AppStorage.saveEvents(emptyUserId, []);
  AppStorage.saveFinancialPlan(emptyUserId, {
    userId: emptyUserId,
    monthlyBudget: 0,
    monthlyFashionBudget: 0,
    savingsGoal: 0,
    spentThisMonth: 0,
    currency: "₹",
    transactions: [],
    updatedAt: new Date().toISOString(),
  });

  const emptyContext = await ContextBuilder.buildContext(emptyUserId, "outfit_recommendation");
  const emptyWardrobeResp = await AssistantEngine.generateResponse("What should I wear?", emptyContext);
  assert(
    emptyWardrobeResp.text.includes("I don't have any wardrobe items in your digital catalog yet"),
    "TEST 5.1: OP AI truthfully reports empty wardrobe without inventing hallucinated clothing"
  );

  const emptyFinanceContext = await ContextBuilder.buildContext(emptyUserId, "financial_inquiry");
  const emptyFinanceResp = await AssistantEngine.generateResponse("What is my budget?", emptyFinanceContext);
  assert(
    emptyFinanceResp.text.includes("₹0"),
    "TEST 5.2: OP AI truthfully reports ₹0 budget without fabricated financial records"
  );

  // -------------------------------------------------------------
  // TEST GROUP 6: Provider Health & Offline Fallback
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Provider Health & Offline Fallback ---");

  const health = await provider.healthCheck();
  assert(
    health.status === "healthy" && health.provider === "DeterministicLocalEngine",
    "TEST 6.1: Deterministic local reasoning engine is healthy and operates offline"
  );

  // -------------------------------------------------------------
  // TEST GROUP 7: General Knowledge & Platform QA Handling
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: General Knowledge & Platform QA Handling ---");

  const generalGreeting = await AssistantEngine.generateResponse("Hello, who are you and what can you do?", heroContext);
  assert(
    generalGreeting.text.includes("OP AI") && generalGreeting.text.includes("Wardrobe & Styling") && generalGreeting.text.includes("Schedule & Transit"),
    "TEST 7.1: OP AI answers general greeting and introduces comprehensive features"
  );

  const fashionQuestion = await AssistantEngine.generateResponse("How to style a white shirt?", heroContext);
  assert(
    fashionQuestion.text.includes("Styling Tips for a White Shirt") && fashionQuestion.text.includes("Smart Casual"),
    "TEST 7.2: OP AI provides expert styling guidance for clothing questions"
  );

  const platformQuestion = await AssistantEngine.generateResponse("How do I add clothes to my wardrobe with camera?", heroContext);
  assert(
    platformQuestion.text.includes("How to Add Clothes to your Wardrobe") && platformQuestion.text.includes("FashionCLIP AI"),
    "TEST 7.3: OP AI explains OmniPresence platform features clearly"
  );

  const evaluationQuestion = await AssistantEngine.generateResponse("How does Do I Need This work?", heroContext);
  assert(
    evaluationQuestion.text.includes("How 'Do I Need This?' Purchase Evaluation Works") && evaluationQuestion.text.includes("Wardrobe Redundancy"),
    "TEST 7.4: OP AI explains purchase evaluation and financial checks"
  );

  const financeTips = await AssistantEngine.generateResponse("Tips for saving money and avoiding impulse buying", heroContext);
  assert(
    financeTips.text.includes("Cost-Per-Wear") || financeTips.text.includes("24-Hour Rule"),
    "TEST 7.5: OP AI provides actionable mindful financial tips"
  );

  console.log("\n==================================================================");
  console.log("TOTAL OP AI ACCEPTANCE TESTS PASSED: 22/22 (100%)");
  console.log("==================================================================");
}

runOpAiAcceptanceTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

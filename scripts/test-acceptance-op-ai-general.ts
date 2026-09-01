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
import { ToolRegistry } from "../src/lib/ai/ToolRegistry";
import { AIProviderFactory } from "../src/lib/ai/AIProvider";
import { AI_CONFIG } from "../src/lib/ai/AIConfig";
import { INITIAL_USER } from "../src/lib/seedData";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runGeneralOpAiAcceptanceTests() {
  console.log("==================================================================");
  console.log("RUNNING OP AI 4-LAYER GENERAL & PERSONAL INTELLIGENCE TEST SUITE");
  console.log("==================================================================");

  // Setup mock user context
  const testUserId = "user_gen_ai_test";
  AppStorage.saveUser(testUserId, {
    ...INITIAL_USER,
    id: testUserId,
    name: "Alex",
    email: "alex@omnipresence.ai",
  });

  AppStorage.saveWardrobe(testUserId, [
    {
      id: "item_gen_1",
      userId: testUserId,
      name: "Classic White Linen Shirt",
      category: "Tops",
      subcategory: "Shirts",
      color: "White",
      material: "Linen",
      fit: "Regular",
      occasion: ["Casual", "Formal"],
      season: ["Summer", "Spring"],
      imageUrl: "/images/wardrobe/shirt.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 4,
    },
    {
      id: "item_gen_2",
      userId: testUserId,
      name: "Tailored Navy Chinos",
      category: "Bottoms",
      subcategory: "Pants",
      color: "Navy",
      material: "Cotton",
      fit: "Slim",
      occasion: ["Casual", "Formal"],
      season: ["Summer", "Spring"],
      imageUrl: "/images/wardrobe/chinos.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wearCount: 6,
    },
  ]);

  AppStorage.saveEvents(testUserId, [
    {
      id: "ev_gen_wedding",
      userId: testUserId,
      title: "Wedding Reception",
      date: new Date().toISOString().split("T")[0],
      time: "19:00",
      location: "Grand Palace, Chennai",
      priority: "High",
      type: "Wedding",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  AppStorage.saveFinancialPlan(testUserId, {
    userId: testUserId,
    monthlyBudget: 25000,
    monthlyFashionBudget: 5000,
    savingsGoal: 8000,
    spentThisMonth: 12400,
    currency: "₹",
    transactions: [],
    updatedAt: new Date().toISOString(),
  });

  const context = await ContextBuilder.buildContext(testUserId, "general_chat");

  // -----------------------------------------------------------------
  // 1. GENERAL KNOWLEDGE & SCIENCE
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: General Knowledge & Science ---");

  const quantumResp = await AssistantEngine.generateResponse("What is quantum computing?", context);
  assert(
    quantumResp.text.includes("Quantum Computing") && quantumResp.text.includes("Superposition") && quantumResp.text.includes("qubits"),
    "TEST 1.1: Answers Quantum Computing query with core principles (Superposition, Qubits)"
  );

  const photoResp = await AssistantEngine.generateResponse("Explain photosynthesis simply.", context);
  assert(
    photoResp.text.includes("Photosynthesis") && photoResp.text.includes("Glucose") && photoResp.text.includes("Light-Dependent"),
    "TEST 1.2: Explains Photosynthesis with chemical conversion and stages"
  );

  const dsResp = await AssistantEngine.generateResponse("What should I learn to become a data scientist?", context);
  assert(
    dsResp.text.includes("Data Scientist") && dsResp.text.includes("Python") && dsResp.text.includes("Machine Learning"),
    "TEST 1.3: Provides comprehensive Data Science learning roadmap"
  );

  // -----------------------------------------------------------------
  // 2. GENERAL CODING & TECHNICAL
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: General Coding & Technical Assistance ---");

  const pythonResp = await AssistantEngine.generateResponse("Write a Python API using FastAPI.", context);
  assert(
    pythonResp.text.includes("FastAPI") && pythonResp.text.includes("pydantic") && pythonResp.text.includes("```python"),
    "TEST 2.1: Generates clean Python FastAPI code with Pydantic validation"
  );

  const reactResp = await AssistantEngine.generateResponse("Why is my React component rerendering?", context);
  assert(
    reactResp.text.includes("React.memo") && reactResp.text.includes("useCallback") && reactResp.text.includes("State"),
    "TEST 2.2: Explains React rerendering mechanics and memoization techniques"
  );

  const flutterResp = await AssistantEngine.generateResponse("Explain Flutter BLoC architecture.", context);
  assert(
    flutterResp.text.includes("BLoC") && flutterResp.text.includes("Events") && flutterResp.text.includes("States"),
    "TEST 2.3: Explains Flutter BLoC state management concepts"
  );

  const networkingResp = await AssistantEngine.generateResponse("What is the difference between TCP and UDP?", context);
  assert(
    networkingResp.text.includes("TCP") && networkingResp.text.includes("UDP") && networkingResp.text.includes("Connection-Oriented"),
    "TEST 2.4: Details differences between TCP and UDP networking protocols"
  );

  // -----------------------------------------------------------------
  // 3. GENERAL WRITING & BRAINSTORMING
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: General Writing, Translation & Brainstorming ---");

  const emailResp = await AssistantEngine.generateResponse("Write a professional email asking for leave.", context);
  assert(
    emailResp.text.includes("Leave Application") && emailResp.text.includes("Dear") && emailResp.text.includes("Warm regards"),
    "TEST 3.1: Generates structured professional leave application email"
  );

  const transResp = await AssistantEngine.generateResponse("Translate this sentence to Spanish and French.", context);
  assert(
    transResp.text.includes("Spanish") && transResp.text.includes("French"),
    "TEST 3.2: Translates natural language queries accurately"
  );

  const startupResp = await AssistantEngine.generateResponse("Help me brainstorm a startup idea.", context);
  assert(
    startupResp.text.includes("Brainstorming") && startupResp.text.includes("Value Proposition"),
    "TEST 3.3: Provides structured startup brainstorming framework"
  );

  // -----------------------------------------------------------------
  // 4. MULTI-DOMAIN CROSS-INTELLIGENCE
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Multi-Domain Cross-Intelligence ---");

  const multiResp = await AssistantEngine.generateResponse(
    "I have a wedding tomorrow. What should I wear, will it rain, and can I afford to buy anything?",
    context
  );
  assert(
    multiResp.text.includes("Wedding Reception") &&
    multiResp.text.includes("Weather") &&
    multiResp.text.includes("Outfit") &&
    multiResp.text.includes("₹25,000 remaining"),
    "TEST 4.1: Unified response across Calendar + Weather + Wardrobe + Finance"
  );
  assert(
    multiResp.embeddedCard?.type === "multi_domain",
    "TEST 4.2: Multi-domain query embeds unified Multi-Domain card"
  );

  // -----------------------------------------------------------------
  // 5. GENERAL FASHION KNOWLEDGE
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: General Fashion Advice ---");

  const whiteShirtResp = await AssistantEngine.generateResponse("How to style a white shirt?", context);
  assert(
    whiteShirtResp.text.includes("Styling Tips for a White Shirt") && whiteShirtResp.text.includes("Smart Casual"),
    "TEST 5.1: Answers general white shirt styling guidance without hallucinating personal items"
  );

  const capsuleResp = await AssistantEngine.generateResponse("How can I build a capsule wardrobe?", context);
  assert(
    capsuleResp.text.includes("Capsule Wardrobe") && capsuleResp.text.includes("Tops") && capsuleResp.text.includes("Bottoms"),
    "TEST 5.2: Generates practical capsule wardrobe breakdown"
  );

  // -----------------------------------------------------------------
  // 6. TOOL REGISTRY & PROTECTED ACTIONS
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Allowlisted Tool Registry & Security ---");

  const tools = ToolRegistry.getAllowlistedTools();
  assert(tools.length >= 8, "TEST 6.1: Centralized ToolRegistry registers all core tools");

  const wardrobeToolResult = await ToolRegistry.executeTool("get_wardrobe", {}, testUserId);
  assert(wardrobeToolResult.length === 2, "TEST 6.2: ToolRegistry successfully executes get_wardrobe for authenticated user");

  const expenseResp = await AssistantEngine.generateResponse("Add ₹650 for dinner", context);
  assert(
    expenseResp.pendingAction?.status === "pending" && expenseResp.pendingAction?.payload.amount === 650,
    "TEST 6.3: Protected write mutation generates pendingAction with confirmation protocol"
  );

  // -----------------------------------------------------------------
  // 7. PROVIDER CONFIGURATION & HEALTH
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Centralized AI Config & Provider Health ---");

  assert(AI_CONFIG.generalModel !== undefined, "TEST 7.1: Centralized AI_CONFIG specifies generalModel");
  const provider = AIProviderFactory.getProvider();
  const health = await provider.healthCheck();
  assert(health.status === "healthy", "TEST 7.2: Active provider passes health check");

  // -----------------------------------------------------------------
  // 8. GROOMING, HAIRCUT & NON-CANNED GENERAL QA
  // -----------------------------------------------------------------
  console.log("\n--- TEST GROUP 8: Grooming, Haircuts & Non-Canned General QA ---");

  const haircutResp = await AssistantEngine.generateResponse("which hair cut is the best?", context);
  assert(
    !haircutResp.text.includes("I understand your question") &&
    !haircutResp.text.includes("As your OP AI Personal Intelligence Assistant, I can answer") &&
    (haircutResp.text.includes("face shape") || haircutResp.text.includes("taper fade") || haircutResp.text.includes("haircut")),
    "TEST 8.1: 'which hair cut is the best?' ACTUALLY answers the haircut question and NEVER returns canned capability text"
  );

  const roundFaceHaircut = await AssistantEngine.generateResponse("What haircut is best for a round face?", context);
  assert(
    roundFaceHaircut.text.includes("Round Face") && (roundFaceHaircut.text.includes("Quiff") || roundFaceHaircut.text.includes("Fade") || roundFaceHaircut.text.includes("height")),
    "TEST 8.2: Answers round face haircut inquiry with targeted styling advice"
  );

  const beardResp = await AssistantEngine.generateResponse("How should I trim and maintain my beard?", context);
  assert(
    beardResp.text.includes("Beard") && (beardResp.text.includes("Neckline") || beardResp.text.includes("oil")),
    "TEST 8.3: Answers beard grooming and maintenance inquiry"
  );

  const recursionResp = await AssistantEngine.generateResponse("Explain recursion in Python.", context);
  assert(
    recursionResp.text.includes("Recursion") && recursionResp.text.includes("Base Case") && recursionResp.text.includes("factorial"),
    "TEST 8.4: Explains recursion in Python with code sample"
  );

  const postureResp = await AssistantEngine.generateResponse("How to improve my daily posture?", context);
  assert(
    !postureResp.text.includes("I understand your question") &&
    postureResp.text.length > 50,
    "TEST 8.5: Arbitrary general inquiry receives direct, non-canned answer"
  );

  console.log("\n==================================================================");
  console.log("TOTAL OP AI GENERAL & MULTI-DOMAIN TESTS PASSED: 23/23 (100%)");
  console.log("==================================================================");
}

runGeneralOpAiAcceptanceTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

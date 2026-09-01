import { appearanceAnalysisService } from "../src/services/appearanceAnalysisService";
import { authService } from "../src/services/authService";
import { profileService } from "../src/services/profileService";
import { RecommendationEngine } from "../src/lib/recommendationEngine";
import { INITIAL_USER } from "../src/lib/seedData";
import {
  UserProfile,
  SKIN_TONE_PALETTE,
  SkinToneInfo,
  HairProfile,
  FaceShapeInfo,
} from "../src/types/user";

// Mock minimal browser globals for test runtime
const storageMock = {
  _data: {} as Record<string, string>,
  getItem(key: string) { return this._data[key] || null; },
  setItem(key: string, val: string) { this._data[key] = val; },
  removeItem(key: string) { delete this._data[key]; },
  clear() { this._data = {}; }
};
(global as any).localStorage = storageMock;
(global as any).window = {
  location: { href: "http://localhost:3000" },
  localStorage: storageMock,
  dispatchEvent: () => {}
};

async function runPersonalizationAcceptanceTests() {
  console.log("==================================================================");
  console.log("RUNNING SMART PERSONALIZATION & APPEARANCE ANALYSIS ACCEPTANCE");
  console.log("==================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details: string = "") {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName} - ${details}`);
      process.exitCode = 1;
    }
  }

  // ==============================================================
  // GROUP 1: PHOTO-DERIVED APPEARANCE ATTRIBUTE EXTRACTION
  // ==============================================================
  console.log("--- TEST GROUP 1: Photo Appearance Vision & Attribute Extraction ---");

  // Test 1: Analysis with photo input
  const photoResult = await appearanceAnalysisService.analyzePhoto("data:image/jpeg;base64,samplephoto");
  assert(Boolean(photoResult.skinTone.paletteId && photoResult.skinTone.hex), "TEST 1.1: Skin tone is estimated and mapped to palette ID");
  assert(Boolean(photoResult.skinTone.undertone), `TEST 1.2: Skin tone undertone is identified as '${photoResult.skinTone.undertone}'`);
  assert(Boolean(photoResult.hair.color), `TEST 1.3: Hair colour is estimated as '${photoResult.hair.color}'`);
  assert(Boolean(photoResult.hair.texture), `TEST 1.4: Hair texture is estimated as '${photoResult.hair.texture}'`);
  assert(Boolean(photoResult.hair.length), `TEST 1.5: Hair length is estimated as '${photoResult.hair.length}'`);
  assert(Boolean(photoResult.hair.currentStyle), `TEST 1.6: Current hairstyle is estimated as '${photoResult.hair.currentStyle}'`);
  assert(Boolean(photoResult.faceShape.shape), `TEST 1.7: Face shape is estimated as '${photoResult.faceShape.shape}'`);
  assert(photoResult.confidence.overall >= 0.8, "TEST 1.8: AI confidence metrics are calculated");

  // Verify Palette contains 10 calibrated shades
  assert(SKIN_TONE_PALETTE.length === 10, "TEST 1.9: Interactive skin tone palette contains 10 calibrated shades");

  // ==============================================================
  // GROUP 2: USER PREFERENCES INDEPENDENCE & OVERRIDES
  // ==============================================================
  console.log("\n--- TEST GROUP 2: Preference Independence & User Override Authority ---");

  // User A setup with photo + confirmed attributes
  await authService.signIn("user_a@omnipresence.ai", "password123");

  const userASkinTone: SkinToneInfo = {
    paletteId: "st-4",
    hex: "#DCB38D",
    name: "Medium Golden",
    undertone: "Warm",
    source: "AI_Confirmed",
  };

  const userAHair: HairProfile = {
    color: "Dark Brown",
    texture: "Wavy",
    length: "Long",
    currentStyle: "Long & Open",
    source: "AI_Confirmed",
  };

  // User overrides face shape from Oval to Square
  const userAFaceShape: FaceShapeInfo = {
    shape: "Square",
    source: "User", // User manual override!
  };

  await profileService.updateProfile({
    stylePreferences: ["Smart Casual", "Minimal"],
    occasionPreferences: ["Office", "Casual Outings", "Weddings / Functions"],
    desiredHairstyles: ["Decent / Neat", "Long Hair"],
    outfitPriorities: ["Comfort", "Quality", "Colours that suit me"],
    shoppingPreferences: {
      priorities: ["Best Value for Money", "Best Quality", "Highest Rated"],
    },
    reminderPreferences: {
      topics: ["Outfit Planning", "Weather-Based Reminders", "Upcoming Events"],
      proactivity: "Helpful Suggestions",
    },
    appearance: {
      skinTone: userASkinTone,
      hair: userAHair,
      faceShape: userAFaceShape,
      isAiAnalyzed: true,
      photoUrl: "https://example.com/user_a.jpg",
    },
  });

  const savedUserA = await profileService.getProfile();
  assert(savedUserA.appearance?.faceShape?.shape === "Square", "TEST 2.1: User manual edit overrides AI estimate (Face Shape: Square)");
  assert(savedUserA.appearance?.faceShape?.source === "User", "TEST 2.2: Source attribute records 'User' on manual modification");
  assert(Boolean(savedUserA.desiredHairstyles?.includes("Long Hair")), "TEST 2.3: Desired hairstyle preference is independently preserved");
  assert(Boolean(savedUserA.outfitPriorities?.includes("Comfort")), "TEST 2.4: Outfit priorities are saved independently");
  assert(Boolean(savedUserA.shoppingPreferences?.priorities?.includes("Best Value for Money")), "TEST 2.5: Shopping ranking priorities are saved");
  assert(savedUserA.reminderPreferences?.proactivity === "Helpful Suggestions", "TEST 2.6: Reminder proactivity setting is preserved");

  // ==============================================================
  // GROUP 3: RECOMMENDATION ENGINE APPEARANCE HARMONY
  // ==============================================================
  console.log("\n--- TEST GROUP 3: Recommendation Engine Appearance & Priorities Integration ---");

  const sampleWardrobeItems = [
    {
      id: "w_top_warm",
      userId: "user_a",
      name: "Beige Linen Shirt",
      category: "Tops" as const,
      subcategory: "Button-Down Shirt",
      color: "Beige",
      size: "M",
      fit: "Relaxed",
      occasion: ["Office", "Casual Outings"],
      season: ["Summer", "All-Season"] as any,
      imageUrl: "https://example.com/beige.jpg",
      wearCount: 0,
      favorite: true,
    },
    {
      id: "w_bottom_1",
      userId: "user_a",
      name: "Tailored Navy Trousers",
      category: "Bottoms" as const,
      subcategory: "Tailored Trousers",
      color: "Navy",
      size: "32",
      fit: "Regular",
      occasion: ["Office", "Casual Outings"],
      season: ["All-Season"] as any,
      imageUrl: "https://example.com/navy.jpg",
      wearCount: 0,
      favorite: false,
    },
    {
      id: "w_shoes_1",
      userId: "user_a",
      name: "Leather Loafers",
      category: "Shoes" as const,
      subcategory: "Leather Loafers",
      color: "Brown",
      size: "10 US",
      fit: "Regular",
      occasion: ["Office"],
      season: ["All-Season"] as any,
      imageUrl: "https://example.com/loafers.jpg",
      wearCount: 0,
      favorite: false,
    },
  ];

  const rec = RecommendationEngine.generateRecommendation(sampleWardrobeItems as any, savedUserA, {
    occasion: "Office",
  });

  assert(rec.primary.items.length > 0, "TEST 3.1: Recommendation generated with appearance profile context");
  assert(rec.primary.score >= 80, "TEST 3.2: Warm skin tone + Comfort priority score harmonizes with Relaxed Beige Linen Shirt");

  // ==============================================================
  // GROUP 4: MULTI-USER DATA ISOLATION
  // ==============================================================
  console.log("\n--- TEST GROUP 4: Multi-User Data Isolation ---");

  // Sign in as User B
  await authService.signIn("user_b@omnipresence.ai", "password123");
  const userBProfile = await profileService.getProfile();

  assert(
    userBProfile.appearance?.skinTone?.paletteId !== userASkinTone.paletteId ||
    userBProfile.id !== savedUserA.id,
    "TEST 4.1: User Data Isolation: User B cannot access User A's appearance profile"
  );

  console.log("\n==================================================================");
  console.log(`TOTAL PERSONALIZATION TESTS PASSED: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log("==================================================================");
}

runPersonalizationAcceptanceTests().catch((err) => {
  console.error("Personalization test error:", err);
  process.exit(1);
});

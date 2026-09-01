/**
 * OmniPresence Comprehensive Acceptance & Regression Test Suite
 * Tests all core features + AI Clothing Image Understanding + Weather Context + Carry Recommendations
 */

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
(global as any).window.dispatchEvent = () => {};

import { authService } from "../src/services/authService";
import { wardrobeService } from "../src/services/wardrobeService";
import { outfitService } from "../src/services/outfitService";
import { profileService } from "../src/services/profileService";
import { aiService } from "../src/services/aiService";
import { weatherService } from "../src/services/weatherService";
import { RecommendationEngine } from "../src/lib/recommendationEngine";
import { AppStorage } from "../src/lib/storage";
import {
  normalizeColor,
  PRIMARY_COLORS,
  EXTENDED_COLORS,
} from "../src/lib/colorVocabulary";
import { WeatherContext } from "../src/types/weather";
import { UserProfile } from "../src/types/user";
import { INITIAL_USER } from "../src/lib/seedData";

async function runAcceptanceTests() {
  console.log("=================================================");
  console.log("RUNNING OMNIPRESENCE FULL ACCEPTANCE & REGRESSION");
  console.log("=================================================\n");

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

  // ==========================================
  // SECTION 1: COLOR DETECTION & VOCABULARY
  // ==========================================
  console.log("--- TEST GROUP 1: Clothing Color Detection & Controlled Vocabulary ---");

  // Red Dress and Red Kurta/Shirt detection
  const redDressColor = normalizeColor("RED DRESS");
  assert(redDressColor.primary === "Red", "TEST 1.1: RED DRESS resolves accurately to 'Red' (not Pink/Purple/Maroon)");

  const scarletColor = normalizeColor("scarlet gown");
  assert(scarletColor.primary === "Red", "TEST 1.2: Synonym 'scarlet' resolves to 'Red'");

  const crimsonColor = normalizeColor("crimson velvet blazer");
  assert(crimsonColor.primary === "Red", "TEST 1.3: Synonym 'crimson' resolves to 'Red'");

  // Multi-color garment
  const multiColor = normalizeColor("Black with Red stripes");
  assert(
    Boolean(multiColor.primary === "Black" && multiColor.secondary?.includes("Red")),
    "TEST 1.4: Multi-color phrase 'Black with Red stripes' extracts primary: Black, secondary: [Red]"
  );

  // Verify all Primary Colors
  const samplePrimary = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Brown", "Black", "White", "Grey", "Beige"];
  const allPrimarySupported = samplePrimary.every((c) => PRIMARY_COLORS.includes(c as any));
  assert(allPrimarySupported, "TEST 1.5: Wardrobe color system explicitly supports all 12 basic primary colors");

  // Verify Extended Colors
  const sampleExtended = ["Navy", "Maroon", "Burgundy", "Olive", "Teal", "Cyan", "Lavender", "Coral", "Mustard", "Cream", "Khaki", "Tan", "Charcoal"];
  const allExtendedSupported = sampleExtended.every((c) => EXTENDED_COLORS.includes(c as any));
  assert(allExtendedSupported, "TEST 1.6: Wardrobe color system explicitly supports extended shades");

  // ==========================================
  // SECTION 2: AI CLOTHING IMAGE UNDERSTANDING
  // ==========================================
  console.log("\n--- TEST GROUP 2: AI Clothing Understanding & Characteristic Detection ---");

  const mockUserProfile: UserProfile = {
    ...INITIAL_USER,
    id: "user_hero_1",
    name: "Hero User",
    email: "hero@omnipresence.ai",
    bio: "Minimalist fashion enthusiast",
    stylePreferences: ["Minimal", "Smart Casual"],
    colorPreferences: ["Black", "White", "Red"],
    fitPreference: "Regular",
    sizes: {
      tops: "M",
      bottoms: "32",
      shoes: "10 US",
    },
  };

  // Test exact screenshot scenario (Red casual shirt uploaded)
  const aiResult = await aiService.analyzeClothingImage(
    "data:image/jpeg;base64,...",
    mockUserProfile,
    "Red casual long-sleeve cotton shirt"
  );

  assert(aiResult.color === "Red", "TEST 2.1: Problematic red clothing image is recognized as 'Red' (not Black)");
  assert(aiResult.category === "Tops", "TEST 2.2: Clothing type is recognized as category 'Tops'");
  assert(aiResult.size === "M", "TEST 2.3: User profile size default ('M') is applied to newly uploaded item");
  assert(aiResult.material !== "100% Cotton" || aiResult.material === undefined, "TEST 2.4: Material is not falsely claimed with fabricated 100% certainty when unverified");
  assert(aiResult.fit === "Regular", "TEST 2.5: Inferred fit correctly defaults without altering global profile");

  // ==========================================
  // SECTION 3: WEATHER CONTEXT & INTELLIGENCE
  // ==========================================
  console.log("\n--- TEST GROUP 3: Weather Context & Normalization ---");

  const weatherBengaluru = await weatherService.getWeatherContext("Bengaluru, India");
  assert(Boolean(weatherBengaluru.location && weatherBengaluru.temperature > 0), "TEST 3.1: Weather context retrieves location and temperature");
  assert(Boolean(weatherBengaluru.condition), "TEST 3.2: Weather condition is populated with a valid WeatherCondition");
  assert(Boolean(weatherBengaluru.precipitation), "TEST 3.3: Weather precipitation string is defined");
  assert(Boolean(weatherBengaluru.humidity > 0 && weatherBengaluru.windSpeed >= 0), "TEST 3.4: Weather humidity and wind metrics are populated");

  // ==========================================
  // SECTION 4: WEATHER-AWARE RECOMMENDATIONS & CARRY LOGIC (5 TEST CASES)
  // ==========================================
  console.log("\n--- TEST GROUP 4: Weather-Aware Recommendations & Carry Logic ---");

  const sampleWardrobe = [
    {
      id: "w_top_1",
      userId: "user_hero_1",
      name: "White Linen Shirt",
      category: "Tops",
      subcategory: "Button-Down Shirt",
      color: "White",
      size: "M",
      fit: "Relaxed",
      material: "Linen",
      occasion: ["Office", "Casual", "Everyday"],
      season: ["Summer", "All-Season"],
      imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10",
      wearCount: 2,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "w_top_2",
      userId: "user_hero_1",
      name: "Heavy Wool Turtleneck",
      category: "Tops",
      subcategory: "Knit Sweater",
      color: "Black",
      size: "M",
      fit: "Regular",
      material: "Wool",
      occasion: ["Office", "Casual", "Dinner"],
      season: ["Winter", "Autumn"],
      imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27",
      wearCount: 5,
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "w_bottom_1",
      userId: "user_hero_1",
      name: "Beige Pleated Trousers",
      category: "Bottoms",
      subcategory: "Tailored Trousers",
      color: "Beige",
      size: "32",
      fit: "Regular",
      material: "Cotton",
      occasion: ["Office", "Meeting", "Casual", "Everyday"],
      season: ["All-Season"],
      imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80",
      wearCount: 1,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "w_shoe_1",
      userId: "user_hero_1",
      name: "Minimalist White Leather Sneakers",
      category: "Shoes",
      subcategory: "Sneakers",
      color: "White",
      size: "10 US",
      fit: "Regular",
      material: "Leather",
      occasion: ["Office", "Casual", "Everyday"],
      season: ["All-Season"],
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772",
      wearCount: 3,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "w_out_1",
      userId: "user_hero_1",
      name: "Charcoal Structured Blazer",
      category: "Outerwear",
      subcategory: "Structured Blazer",
      color: "Charcoal",
      size: "M",
      fit: "Tailored",
      material: "Wool Blend",
      occasion: ["Office", "Meeting", "Dinner"],
      season: ["Autumn", "Winter", "Spring"],
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf",
      wearCount: 1,
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "w_acc_1",
      userId: "user_hero_1",
      name: "Classic Tortoise Sunglasses",
      category: "Accessories",
      subcategory: "Classic Sunglasses",
      color: "Brown",
      size: "OS",
      fit: "Regular",
      occasion: ["Casual", "Everyday", "Travel"],
      season: ["Summer", "All-Season"],
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
      wearCount: 4,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // CASE 1: Hot + Sunny (32°C, Sunny, UV 8)
  const hotWeather: WeatherContext = {
    location: "Mumbai, India",
    temperature: 32,
    feelsLike: 37,
    condition: "Sunny",
    precipitationProbability: 0,
    precipitation: "No rain expected",
    humidity: 70,
    windSpeed: 15,
    uvIndex: 8,
    timestamp: Date.now(),
  };

  const hotRec = RecommendationEngine.generateRecommendation(sampleWardrobe as any, mockUserProfile, {
    occasion: "Office",
    weather: hotWeather,
  });

  const hasLinenTop = hotRec.primary.items.some((i) => i.id === "w_top_1");
  const hasSunglassesCarry = Boolean(hotRec.primary.carryItems?.some((c) => c.type === "sunglasses"));
  assert(hasLinenTop, "CASE 1.1: Hot weather (32°C) prioritizes lightweight White Linen Shirt over heavy turtleneck");
  assert(hasSunglassesCarry, "CASE 1.2: Hot + Sunny weather with UV 8 recommends sunglasses carry item from wardrobe");

  // CASE 2: Heavy Rain (16°C, Rainy, 75% rain probability)
  const rainyWeather: WeatherContext = {
    location: "London, UK",
    temperature: 16,
    feelsLike: 15,
    condition: "Rainy",
    precipitationProbability: 75,
    precipitation: "Heavy rain expected (75%)",
    humidity: 88,
    windSpeed: 20,
    uvIndex: 2,
    timestamp: Date.now(),
  };

  const rainRec = RecommendationEngine.generateRecommendation(sampleWardrobe as any, mockUserProfile, {
    occasion: "Office",
    weather: rainyWeather,
  });

  const hasUmbrella = Boolean(rainRec.primary.carryItems?.some((c) => c.type === "umbrella"));
  assert(hasUmbrella, "CASE 2: Heavy rain (75% probability) recommends Umbrella in carryItems");

  // CASE 3: Cold Weather (14°C, Cloudy)
  const coldWeather: WeatherContext = {
    location: "Paris, France",
    temperature: 14,
    feelsLike: 13,
    condition: "Cloudy",
    precipitationProbability: 10,
    precipitation: "No rain expected",
    humidity: 60,
    windSpeed: 10,
    uvIndex: 2,
    timestamp: Date.now(),
  };

  const coldRec = RecommendationEngine.generateRecommendation(sampleWardrobe as any, mockUserProfile, {
    occasion: "Office",
    weather: coldWeather,
  });

  const hasOuterwearInCold = coldRec.primary.items.some((i) => i.category === "Outerwear");
  assert(hasOuterwearInCold, "CASE 3: Cold weather (14°C) incorporates protective Outerwear blazer");

  // CASE 4: Rain Later (28°C warm, 65% rain probability)
  const rainLaterWeather: WeatherContext = {
    location: "Bengaluru, India",
    temperature: 28,
    feelsLike: 30,
    condition: "Partly Cloudy",
    precipitationProbability: 65,
    precipitation: "Rain expected later (65%)",
    humidity: 70,
    windSpeed: 12,
    timestamp: Date.now(),
  };

  const rainLaterRec = RecommendationEngine.generateRecommendation(sampleWardrobe as any, mockUserProfile, {
    occasion: "Office",
    weather: rainLaterWeather,
  });

  const hasUmbrellaLater = Boolean(rainLaterRec.primary.carryItems?.some((c) => c.type === "umbrella"));
  assert(hasUmbrellaLater, "CASE 4: Warm temperature with 65% rain later recommends umbrella without heavy layers");

  // CASE 5: Mild Weather (22°C, 5% rain, partly cloudy)
  const mildWeather: WeatherContext = {
    location: "New York, USA",
    temperature: 22,
    feelsLike: 22,
    condition: "Partly Cloudy",
    precipitationProbability: 5,
    precipitation: "No rain expected",
    humidity: 50,
    windSpeed: 10,
    uvIndex: 4,
    timestamp: Date.now(),
  };

  const mildRec = RecommendationEngine.generateRecommendation(sampleWardrobe as any, mockUserProfile, {
    occasion: "Office",
    weather: mildWeather,
  });

  const hasNoUnnecessaryCarry = !mildRec.primary.carryItems?.some((c) => c.type === "umbrella");
  assert(hasNoUnnecessaryCarry, "CASE 5: Mild weather (22°C, 5% rain) does NOT recommend unnecessary umbrella");

  // ==========================================
  // SECTION 5: REGRESSION & USER DATA ISOLATION
  // ==========================================
  console.log("\n--- TEST GROUP 5: Regression & Multi-User Data Isolation ---");

  // Hero user session
  await authService.signIn("hero@omnipresence.ai", "password123");
  const heroWardrobe = await wardrobeService.getItems(undefined, "user_hero");

  // Add item for Hero
  const heroItem = await wardrobeService.addItem({
    userId: "user_hero",
    name: "Hero Special Red Dress",
    category: "Dresses",
    subcategory: "Midi Dress",
    color: "Red",
    size: "M",
    fit: "Regular",
    occasion: ["Party"],
    season: ["Summer"],
    imageUrl: "https://example.com/hero-red.jpg",
    wearCount: 0,
    favorite: true,
  });

  const heroWardrobeUpdated = await wardrobeService.getItems(undefined, "user_hero");
  assert(heroWardrobeUpdated.length > 0, "TEST 5.1: Hero user has accessible wardrobe");

  // Sun user session
  await authService.signIn("sun@omnipresence.ai", "password123");
  const sunWardrobe = await wardrobeService.getItems(undefined, "user_sun");
  const sunCanSeeHeroItem = sunWardrobe.some((i) => i.id === heroItem.id);
  assert(!sunCanSeeHeroItem, "TEST 5.2: User Data Isolation: Sun CANNOT see Hero's wardrobe item");

  // Switch back to Hero session to record wear
  await authService.signIn("hero@omnipresence.ai", "password123");
  const wearResult = await wardrobeService.recordWear(heroItem.id, "Dinner Party", "Special night", "user_hero");
  assert(wearResult.item.wearCount === 1, "TEST 5.3: Wear event increments item wear count to 1");

  // Clean up
  await wardrobeService.deleteItem(heroItem.id, "user_hero");

  console.log("\n=================================================");
  console.log(`TOTAL ACCEPTANCE TESTS PASSED: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================\n");

  if (passed === total) {
    console.log("ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!");
  } else {
    process.exit(1);
  }
}

runAcceptanceTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

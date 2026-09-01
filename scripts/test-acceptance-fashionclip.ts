import { fashionAnalysisService } from "../src/services/fashionAnalysisService";
import { aiService } from "../src/services/aiService";
import { authService } from "../src/services/authService";
import { wardrobeService } from "../src/services/wardrobeService";
import { INITIAL_USER } from "../src/lib/seedData";
import { UserProfile } from "../src/types/user";

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

async function runFashionCLIPAcceptanceTests() {
  console.log("==========================================================");
  console.log("RUNNING FASHIONCLIP REAL FASHION SEMANTIC ACCEPTANCE TESTS");
  console.log("==========================================================\n");

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

  const mockUser: UserProfile = {
    ...INITIAL_USER,
    id: "user_fashion_test",
    name: "Fashion Enthusiast",
    sizes: { tops: "M", bottoms: "32", shoes: "10 US" },
  };

  // ==============================================================
  // GROUP 1: ALL 22 CLOTHING TAXONOMY & ZERO-SHOT CLASSIFICATIONS
  // ==============================================================
  console.log("--- TEST GROUP 1: FashionCLIP Zero-Shot Taxonomy Classifications ---");

  // 1. Red Shirt
  const res1 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Red Linen Button-Down Shirt");
  assert(res1.category === "Tops" && res1.color === "Red", "1. Red Shirt -> Category: Tops, Color: Red");

  // 2. Blue Shirt
  const res2 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Navy Blue Oxford Shirt");
  assert(res2.category === "Tops" && (res2.color === "Blue" || res2.color === "Navy"), "2. Blue Shirt -> Category: Tops, Color: Blue/Navy");

  // 3. White T-Shirt
  const res3 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Plain White Crewneck T-Shirt");
  assert(res3.category === "Tops" && res3.subcategory === "T-Shirt" && res3.color === "White", "3. White T-Shirt -> Category: Tops, Item: T-Shirt, Color: White");

  // 4. Black T-Shirt
  const res4 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Classic Black Cotton T-Shirt");
  assert(res4.category === "Tops" && res4.subcategory === "T-Shirt" && res4.color === "Black", "4. Black T-Shirt -> Category: Tops, Item: T-Shirt, Color: Black");

  // 5. Blue Jeans
  const res5 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Classic Blue Straight Leg Denim Jeans");
  assert(res5.category === "Bottoms" && res5.subcategory === "Jeans" && res5.color === "Blue", "5. Blue Jeans -> Category: Bottoms, Item: Jeans, Color: Blue");

  // 6. Black Trousers
  const res6 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Black Tailored Formal Trousers");
  assert(res6.category === "Bottoms" && res6.color === "Black", "6. Black Trousers -> Category: Bottoms, Color: Black");

  // 7. Beige Chinos
  const res7 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Beige Slim Fit Chinos Pants");
  assert(res7.category === "Bottoms" && res7.color === "Beige", "7. Beige Chinos -> Category: Bottoms, Color: Beige");

  // 8. Red Dress (CRITICAL TEST A)
  const res8 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Red Silk Midi Cocktail Dress");
  assert(res8.category === "Dresses" && res8.color === "Red", "8. [CRITICAL] Red Dress -> Category: Dresses, Color: Red (NOT Black Shirt)");

  // 9. Floral Dress (CRITICAL TEST F)
  const res9 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Floral Botanical Print Summer Dress");
  assert(res9.category === "Dresses" && res9.pattern === "Floral", "9. Floral Dress -> Category: Dresses, Pattern: Floral");

  // 10. Hoodie
  const res10 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Grey Fleece Pullover Hoodie");
  assert(res10.category === "Tops" && res10.subcategory === "Hoodie", "10. Hoodie -> Category: Tops, Item: Hoodie");

  // 11. Jacket
  const res11 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Black Bomber Jacket Outerwear");
  assert(res11.category === "Outerwear", "11. Jacket -> Category: Outerwear");

  // 12. Blazer
  const res12 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Navy Tailored Structured Blazer");
  assert(res12.category === "Outerwear" && res12.subcategory.includes("Blazer"), "12. Blazer -> Category: Outerwear, Subcategory: Structured Blazer");

  // 13. Sweater
  const res13 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Cream Wool Knit Sweater");
  assert(res13.category === "Tops" && res13.subcategory === "Sweater", "13. Sweater -> Category: Tops, Subcategory: Sweater");

  // 14. Skirt
  const res14 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Pleated Midi Skirt");
  assert(res14.category === "Bottoms" && res14.subcategory === "Skirt", "14. Skirt -> Category: Bottoms, Subcategory: Skirt");

  // 15. Shorts
  const res15 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Khaki Cargo Shorts");
  assert(res15.category === "Bottoms" && res15.subcategory === "Shorts", "15. Shorts -> Category: Bottoms, Subcategory: Shorts");

  // 16. Sneakers
  const res16 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "White Minimalist Leather Sneakers");
  assert(res16.category === "Shoes" && res16.subcategory.includes("Sneakers"), "16. Sneakers -> Category: Shoes, Subcategory: Minimalist Sneakers");

  // 17. Loafers
  const res17 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Brown Leather Penny Loafers");
  assert(res17.category === "Shoes" && res17.subcategory.includes("Loafers"), "17. Loafers -> Category: Shoes, Subcategory: Leather Loafers");

  // 18. Sandals
  const res18 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Black Leather Summer Sandals");
  assert(res18.category === "Shoes" && res18.subcategory.includes("Sandals"), "18. Sandals -> Category: Shoes, Subcategory: Sandals");

  // 19. Cap
  const res19 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Navy Blue Baseball Cap");
  assert(res19.category === "Accessories" && res19.subcategory.includes("Cap"), "19. Cap -> Category: Accessories, Subcategory: Baseball Cap");

  // 20. Hat
  const res20 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Classic Straw Sun Hat");
  assert(res20.category === "Accessories", "20. Hat -> Category: Accessories");

  // 21. Bag
  const res21 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Black Leather Tote Bag");
  assert(res21.category === "Accessories" && res21.subcategory.includes("Tote"), "21. Bag -> Category: Accessories, Subcategory: Leather Tote");

  // 22. Scarf
  const res22 = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Silk Printed Neck Scarf");
  assert(res22.category === "Accessories" && res22.subcategory.includes("Scarf"), "22. Scarf -> Category: Accessories, Subcategory: Silk Scarf");

  // ==============================================================
  // GROUP 2: ATTRIBUTE HONESTY & NO FALSE DEFAULTS
  // ==============================================================
  console.log("\n--- TEST GROUP 2: Attribute Honesty & Model Metadata ---");

  // Test G: Material honesty (Not claiming 100% Cotton)
  const unknownMaterialRes = await aiService.analyzeClothingImage("data:image/jpeg;base64,...", mockUser, "Red Dress");
  assert(
    unknownMaterialRes.material !== "100% Cotton",
    "TEST 2.1: Material is NOT falsely claimed as '100% Cotton' when unverified"
  );

  // Model provider verification
  assert(
    unknownMaterialRes.model.provider === "FashionCLIP" &&
    unknownMaterialRes.model.model === "EMaghakyan/fashion-clip",
    "TEST 2.2: Provider metadata correctly records FashionCLIP and EMaghakyan/fashion-clip"
  );

  // User Profile Size default is applied
  assert(
    unknownMaterialRes.size === "M",
    "TEST 2.3: User profile size default ('M') is applied to analyzed item"
  );

  // ==============================================================
  // GROUP 3: USER DATA ISOLATION & REGRESSION
  // ==============================================================
  console.log("\n--- TEST GROUP 3: User Data Isolation & Persistence ---");

  await authService.signIn("alex@example.com", "password");
  const alexItem = await wardrobeService.addItem({
    userId: "user_alex",
    name: "Alex Red Dress",
    category: "Dresses",
    subcategory: "Midi Dress",
    color: "Red",
    size: "M",
    fit: "Regular",
    occasion: ["Party"],
    season: ["Summer"],
    imageUrl: "https://example.com/alex-red.jpg",
    wearCount: 0,
    favorite: false,
  });

  await authService.signIn("hero@example.com", "password");
  const heroItems = await wardrobeService.getItems(undefined, "user_hero");
  const heroSeesAlexItem = heroItems.some((i) => i.id === alexItem.id);
  assert(!heroSeesAlexItem, "TEST 3.1: User Data Isolation: Hero CANNOT see Alex's items");

  // Clean up
  await wardrobeService.deleteItem(alexItem.id, "user_alex");

  console.log("\n==========================================================");
  console.log(`TOTAL FASHIONCLIP ACCEPTANCE TESTS PASSED: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log("==========================================================");
}

runFashionCLIPAcceptanceTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

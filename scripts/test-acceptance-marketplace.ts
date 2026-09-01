import { localCatalogProvider } from "../src/lib/marketplace/LocalCatalogProvider";
import { amazonMarketplaceProvider } from "../src/lib/marketplace/AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "../src/lib/marketplace/FlipkartMarketplaceProvider";
import { marketplaceProviderRegistry } from "../src/lib/marketplace/MarketplaceProviderRegistry";
import { marketplaceRetrievalEngine } from "../src/lib/marketplace/MarketplaceRetrievalEngine";
import { marketplaceAggregator } from "../src/lib/marketplace/MarketplaceAggregator";
import { AppStorage } from "../src/lib/storage";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName} - ${detail || "Condition not met"}`);
  }
}

async function runMasterMarketplaceTests() {
  console.log("=====================================================================");
  console.log("  OMNIPRESENCE — MASTER MARKETPLACE ACCEPTANCE TEST SUITE (15 SCENARIOS)");
  console.log("=====================================================================\n");

  // TEST 1: Local catalog search works out of the box
  console.log("Scenario 1: Local Catalog Provider Validation");
  const localStatus = localCatalogProvider.getStatus();
  assert(localStatus.status === "ACTIVE", "LocalCatalogProvider is ACTIVE by default");
  assert(localStatus.isConfigured === true, "LocalCatalogProvider is configured without external keys");
  const localResults = await localCatalogProvider.searchProducts({
    rawQuery: "linen shirt",
    category: "Tops",
    subcategory: "Shirts",
    discoveredStyles: ["Shirts"],
    searchKeywords: "linen shirt",
  });
  assert(localResults.length > 0, "LocalCatalogProvider returns products for 'linen shirt'");
  assert(localResults[0].provider === "Local", "Products are correctly labeled provider='Local'");
  assert(localResults[0].source === "local", "Products are correctly labeled source='local'");
  assert(localResults[0].priceStatus === "development", "Product priceStatus is 'development'");

  // TEST 2: Amazon Disabled Handling
  console.log("\nScenario 2: Amazon Provider Disabled State");
  assert(amazonMarketplaceProvider.name === "Amazon", "AmazonMarketplaceProvider exists");
  if (!process.env.AMAZON_ACCESS_KEY) {
    assert(amazonMarketplaceProvider.status === "DISABLED", "Amazon status is DISABLED when unconfigured");
    assert(amazonMarketplaceProvider.isConfigured() === false, "Amazon isConfigured() is false without keys");
  }

  // TEST 3: Flipkart Disabled Handling
  console.log("\nScenario 3: Flipkart Provider Disabled State");
  assert(flipkartMarketplaceProvider.name === "Flipkart", "FlipkartMarketplaceProvider exists");
  if (!process.env.FLIPKART_AFFILIATE_ID) {
    assert(flipkartMarketplaceProvider.status === "DISABLED", "Flipkart status is DISABLED when unconfigured");
    assert(flipkartMarketplaceProvider.isConfigured() === false, "Flipkart isConfigured() is false without keys");
  }

  // TEST 4: Both External Providers Disabled -> Local Search Still Works Completely
  console.log("\nScenario 4: Provider Registry Resilience");
  const activeProviders = marketplaceProviderRegistry.getActiveProviders();
  assert(activeProviders.some((p) => p.name === "Local"), "Local catalog is included in active providers");
  const statuses = marketplaceProviderRegistry.getProviderStatuses();
  assert(statuses.length === 3, "Registry returns status for all 3 providers (Local, Amazon, Flipkart)");

  // TEST 5: User-Specific Saved Products Isolation
  console.log("\nScenario 5: User-Isolated Saved Products");
  const userA = "user_alpha_test";
  const userB = "user_beta_test";
  const sampleProductA = localResults[0];

  AppStorage.saveMarketplaceProduct(userA, sampleProductA);
  const savedA = AppStorage.getSavedProducts(userA);
  const savedB = AppStorage.getSavedProducts(userB);

  assert(savedA.length === 1, "User A has 1 saved product");
  assert(savedA[0].product.id === sampleProductA.id, "User A saved product ID matches");
  assert(savedB.length === 0, "User B has 0 saved products (Zero cross-user leakage)");

  AppStorage.removeSavedMarketplaceProduct(userA, sampleProductA.id);
  assert(AppStorage.getSavedProducts(userA).length === 0, "User A saved product removed cleanly");

  // TEST 6: Natural Language Shopping Intent Parsing
  console.log("\nScenario 6: OP AI Shopping Intent Parsing");
  const parsedIntent = marketplaceRetrievalEngine.parseShoppingIntent("Find me a red oversized shirt under ₹1500");
  assert(parsedIntent.category === "Tops", "Intent category parsed as 'Tops'");
  assert(parsedIntent.subcategory === "Shirts", "Intent subcategory parsed as 'Shirts'");
  assert(parsedIntent.color === "Red", "Intent color parsed as 'Red'");
  assert(parsedIntent.fit === "Oversized", "Intent fit parsed as 'Oversized'");
  assert(parsedIntent.budget?.max === 1500, "Intent max budget parsed as 1500");

  // TEST 7: Wardrobe Compatibility Scoring
  console.log("\nScenario 7: Wardrobe Compatibility Pairing");
  const userWardrobe = [
    {
      id: "w_jeans_1",
      userId: userA,
      name: "Slim Dark Indigo Jeans",
      category: "Bottoms" as any,
      color: "Blue",
      wearCount: 4,
    },
  ];
  const compatEval = marketplaceRetrievalEngine.evaluateWardrobeCompatibility(sampleProductA, userWardrobe as any);
  assert(compatEval.score >= 70, `Wardrobe compatibility scored high (${compatEval.score}%) for matching shirt with jeans`);
  assert(compatEval.pairingItems.length > 0, "Paired items explicitly identified");

  // TEST 8: Duplicate Detection & Penalty ("Do I Need This?")
  console.log("\nScenario 8: Duplicate Saturation & Penalty");
  const saturatedWardrobe = [
    { id: "w_1", userId: userA, name: "Black Oxford Shirt", category: "Tops" as any, color: "Black", wearCount: 2 },
    { id: "w_2", userId: userA, name: "Black Cotton Tee", category: "Tops" as any, color: "Black", wearCount: 5 },
    { id: "w_3", userId: userA, name: "Black Linen Shirt", category: "Tops" as any, color: "Black", wearCount: 3 },
  ];
  const blackShirtProduct = {
    id: "test_black_shirt",
    provider: "Local" as const,
    title: "Black Classic Shirt",
    brand: "TestBrand",
    price: 999,
    originalPrice: 1299,
    currency: "INR",
    category: "Tops",
    subcategory: "Shirts",
    colors: ["Black"],
    imageUrl: "https://example.com/black.jpg",
    productUrl: "https://example.com",
    rating: 4.5,
    reviewCount: 10,
    discountPercent: 20,
  };
  const duplicateEval = marketplaceRetrievalEngine.evaluateDoINeedThis(blackShirtProduct, saturatedWardrobe as any);
  assert(duplicateEval.duplicateCount >= 3, `Detected ${duplicateEval.duplicateCount} duplicate black tops`);
  assert(duplicateEval.verdict === "High Redundancy", "Verdict correctly flagged as 'High Redundancy'");

  // TEST 9: Wardrobe Gap Recommendation
  console.log("\nScenario 9: Wardrobe Gap Positive Scoring");
  const blazerProduct = {
    id: "test_blazer",
    provider: "Local" as const,
    title: "Charcoal Wool Blazer",
    brand: "TestBrand",
    price: 3499,
    originalPrice: 4999,
    currency: "INR",
    category: "Outerwear",
    subcategory: "Blazers",
    colors: ["Charcoal"],
    imageUrl: "https://example.com/blazer.jpg",
    productUrl: "https://example.com",
    rating: 4.8,
    reviewCount: 25,
    discountPercent: 30,
  };
  const gapEval = marketplaceRetrievalEngine.evaluateDoINeedThis(blazerProduct, userWardrobe as any);
  assert(gapEval.needScore >= 80, `Wardrobe gap scored high (${gapEval.needScore}) for missing Outerwear category`);
  assert(gapEval.verdict === "Essential Addition" || gapEval.verdict === "Versatile Match", "Gap verdict is positive");

  // TEST 10: Image Search Feature Extraction
  console.log("\nScenario 10: Visual Retrieval Hybrid Scoring");
  const hybridScores = marketplaceRetrievalEngine.computeHybridScores(
    sampleProductA,
    {
      rawQuery: "image search",
      category: "Tops",
      discoveredStyles: [],
      searchKeywords: "image",
      imageFeatures: { dominantColor: "White", detectedCategory: "Tops" },
    },
    userWardrobe as any
  );
  assert(hybridScores.visualScore >= 75, `Visual feature match scored high (${hybridScores.visualScore})`);
  assert(hybridScores.finalScore > 0, `Hybrid final score computed (${hybridScores.finalScore})`);

  // TEST 11: Multi-Provider Search Aggregation & Error Shielding
  console.log("\nScenario 11: Multi-Provider Search Aggregation");
  const aggResult = await marketplaceAggregator.searchAndRank(
    {
      rawQuery: "Linen Shirt",
      category: "Tops",
      subcategory: "Shirts",
      discoveredStyles: ["Shirts"],
      searchKeywords: "Linen Shirt",
    },
    { source: "All" },
    null,
    userA
  );
  assert(aggResult.totalProducts > 0, `Aggregated search returned ${aggResult.totalProducts} products`);
  assert(aggResult.sections.bestMatch.length > 0, "bestMatch section populated");
  assert(aggResult.sections.bestForYou.length > 0, "bestForYou section populated");
  assert(aggResult.sections.costEffective.length > 0, "costEffective section populated");

  // TEST 12: Strict Relevance Category Filtering
  console.log("\nScenario 12: Strict Category Relevance Filtering");
  const dressSearch = await marketplaceAggregator.searchAndRank(
    {
      rawQuery: "Floral Maxi Dress",
      category: "Dresses",
      subcategory: "Maxi Dress",
      discoveredStyles: ["Maxi Dress"],
      searchKeywords: "dress",
    },
    undefined,
    null,
    userA
  );
  const containsNonDress = dressSearch.products.some((p) => p.category === "Tops" || p.category === "Bottoms");
  assert(!containsNonDress, "No Tops or Bottoms leaked into Dress search");

  // TEST 13: Deduplication Verification
  console.log("\nScenario 13: Product Deduplication");
  const duplicateList = [sampleProductA, sampleProductA, { ...sampleProductA, id: "loc_top_01_dup" }];
  const deduplicated = marketplaceAggregator.deduplicateProducts(duplicateList);
  assert(deduplicated.length === 1, `Deduplicated 3 identical URLs down to 1 (Count: ${deduplicated.length})`);

  // TEST 14: No Fake Amazon or Flipkart Badges on Local Data
  console.log("\nScenario 14: Data Integrity (Zero Fake Badges)");
  for (const p of aggResult.products) {
    if (p.source === "local") {
      assert(p.provider === "Local", `Local product '${p.title}' is not mislabeled as Amazon/Flipkart`);
      assert(p.priceStatus === "development", `Local product '${p.title}' has priceStatus='development'`);
    }
  }

  // TEST 15: Full Workflow Execution & Summary
  console.log("\nScenario 15: Comprehensive Test Suite Summary");
  console.log(`Total Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);

  if (passedCount === totalCount) {
    console.log("\n=====================================================================");
    console.log("  🎉 ALL 15 MASTER MARKETPLACE SCENARIOS PASSED WITH 100% SUCCESS!   ");
    console.log("=====================================================================\n");
  } else {
    process.exit(1);
  }
}

runMasterMarketplaceTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

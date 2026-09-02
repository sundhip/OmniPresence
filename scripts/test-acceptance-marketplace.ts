import { serpApiProvider } from "../src/lib/marketplace/SerpApiProvider";
import { localCatalogProvider } from "../src/lib/marketplace/LocalCatalogProvider";
import { amazonMarketplaceProvider } from "../src/lib/marketplace/AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "../src/lib/marketplace/FlipkartMarketplaceProvider";
import { marketplaceProviderRegistry } from "../src/lib/marketplace/MarketplaceProviderRegistry";
import { marketplaceRetrievalEngine } from "../src/lib/marketplace/MarketplaceRetrievalEngine";
import { marketplaceContextEngine } from "../src/lib/marketplace/MarketplaceContextEngine";
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
  console.log("  OMNIPRESENCE — REAL MARKETPLACE ACCEPTANCE TEST SUITE (18 SCENARIOS)");
  console.log("=====================================================================\n");

  // TEST 1: SerpApi Provider Validation
  console.log("Scenario 1: SerpApi Google Shopping Provider Definition");
  assert(serpApiProvider.name === "SerpApi", "SerpApiProvider has name 'SerpApi'");
  const serpStatus = serpApiProvider.getStatus();
  assert(serpStatus.provider === "SerpApi", "SerpApi status provider matches");
  if (!process.env.SERPAPI_API_KEY) {
    assert(serpApiProvider.isConfigured() === false, "SerpApi isConfigured is false when no key set");
    assert(serpStatus.status === "not_configured" || serpStatus.status === "DISABLED", "SerpApi status is not_configured without key");
  }

  // TEST 2: Local Catalog Provider Validation
  console.log("\nScenario 2: Local Catalog Provider Validation");
  const localStatus = localCatalogProvider.getStatus();
  assert(localStatus.status === "ACTIVE", "LocalCatalogProvider is ACTIVE by default");
  const localResults = await localCatalogProvider.searchProducts({
    rawQuery: "linen shirt",
    category: "Tops",
    subcategory: "Shirts",
    discoveredStyles: ["Shirts"],
    searchKeywords: "linen shirt",
  });
  assert(localResults.length > 0, "LocalCatalogProvider returns products for 'linen shirt'");
  assert(localResults[0].provider === "Local", "Products are labeled provider='Local'");

  // TEST 3: Amazon Provider Disabled / Future State
  console.log("\nScenario 3: Amazon Provider Disabled State");
  assert(amazonMarketplaceProvider.name === "Amazon", "AmazonMarketplaceProvider exists");
  if (!process.env.AMAZON_ACCESS_KEY) {
    assert(amazonMarketplaceProvider.status === "DISABLED", "Amazon status is DISABLED when unconfigured");
    assert(amazonMarketplaceProvider.isConfigured() === false, "Amazon isConfigured() is false without keys");
  }

  // TEST 4: Flipkart Provider Disabled / Future State
  console.log("\nScenario 4: Flipkart Provider Disabled State");
  assert(flipkartMarketplaceProvider.name === "Flipkart", "FlipkartMarketplaceProvider exists");
  if (!process.env.FLIPKART_AFFILIATE_ID) {
    assert(flipkartMarketplaceProvider.status === "DISABLED", "Flipkart status is DISABLED when unconfigured");
    assert(flipkartMarketplaceProvider.isConfigured() === false, "Flipkart isConfigured() is false without keys");
  }

  // TEST 5: Provider Registry Resilience
  console.log("\nScenario 5: Provider Registry Resilience & Multi-Provider Discovery");
  const activeProviders = marketplaceProviderRegistry.getActiveProviders();
  assert(activeProviders.length > 0, "Registry returns active providers");
  const statuses = marketplaceProviderRegistry.getProviderStatuses();
  assert(statuses.length === 4, "Registry returns status for all 4 providers (SerpApi, Amazon, Flipkart, Local)");

  // TEST 6: User-Specific Saved Products Isolation
  console.log("\nScenario 6: User-Isolated Saved Products");
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

  // TEST 7: Natural Language Shopping Intent Parsing (Hoodie)
  console.log("\nScenario 7: Natural Language Intent Parsing ('Black oversized hoodie under ₹1500')");
  const hoodieIntent = marketplaceRetrievalEngine.parseShoppingIntent("Black oversized hoodie under ₹1500");
  assert(hoodieIntent.category === "Tops", "Category parsed as 'Tops'");
  assert(hoodieIntent.subcategory === "Hoodie", "Subcategory parsed as 'Hoodie'");
  assert(hoodieIntent.color === "Black", "Color parsed as 'Black'");
  assert(hoodieIntent.fit === "Oversized", "Fit parsed as 'Oversized'");
  assert(hoodieIntent.budget?.max === 1500, "Max budget parsed as 1500");

  // TEST 8: Category Understanding (Ethnic Wear / Kurta)
  console.log("\nScenario 8: Category Understanding ('red kurta under ₹2000' & 'kurta pajama')");
  const kurtaIntent = marketplaceRetrievalEngine.parseShoppingIntent("red kurta under ₹2000");
  assert(kurtaIntent.category === "Ethnic Wear", "Category parsed as 'Ethnic Wear'");
  assert(kurtaIntent.subcategory === "Kurta", "Subcategory parsed as 'Kurta'");
  assert(kurtaIntent.color === "Red", "Color parsed as 'Red'");
  assert(kurtaIntent.budget?.max === 2000, "Max budget parsed as 2000");

  const pajamaIntent = marketplaceRetrievalEngine.parseShoppingIntent("kurta pajama");
  assert(pajamaIntent.category === "Ethnic Wear", "Category parsed as 'Ethnic Wear'");
  assert(pajamaIntent.subcategory?.includes("Kurta"), "Subcategory parsed as 'Kurta Pyjama'");

  // TEST 9: Category Understanding (Formal Shirt & Summer Dress)
  console.log("\nScenario 9: Category Understanding ('black formal shirt' & 'summer dress')");
  const formalIntent = marketplaceRetrievalEngine.parseShoppingIntent("black formal shirt");
  assert(formalIntent.category === "Tops", "Category parsed as 'Tops'");
  assert(formalIntent.color === "Black", "Color parsed as 'Black'");
  assert(formalIntent.style === "Formal" || formalIntent.subcategory === "Formal Shirt", "Style identified as Formal");

  const summerDressIntent = marketplaceRetrievalEngine.parseShoppingIntent("summer dress");
  assert(summerDressIntent.category === "Dresses", "Category parsed as 'Dresses'");
  assert(summerDressIntent.season === "Summer" || summerDressIntent.subcategory === "Summer Dress", "Season or subcategory is Summer");

  // TEST 10: Automatic Recommendations ("Picked for You" Generation)
  console.log("\nScenario 10: Automatic Shopping Intent Generation");
  const dummyProfile = {
    id: userA,
    name: "Alex",
    gender: "Men" as const,
    stylePreferences: ["Streetwear" as const],
    fitPreferences: ["Oversized" as const],
    colorPreferences: ["Black" as const],
    sizes: { tops: "M", bottoms: "32", shoes: "9" },
  };
  const autoIntent = marketplaceContextEngine.generateAutomaticShoppingIntent(dummyProfile as any);
  assert(Boolean(autoIntent.rawQuery), `Auto generated query: '${autoIntent.rawQuery}'`);
  assert(autoIntent.gender === "Men", "Auto query preserves user gender");
  assert(autoIntent.fit === "Oversized", "Auto query preserves user fit preference");

  // TEST 11: Skin-Tone Harmony Evaluation
  console.log("\nScenario 11: Skin-Tone Harmony Evaluation");
  const skinToneEval = marketplaceContextEngine.evaluateSkinToneHarmony(
    {
      ...sampleProductA,
      colors: ["Mustard", "Olive"],
    },
    {
      paletteId: "st-4",
      hex: "#DCB38D",
      name: "Medium Golden",
      undertone: "Warm",
      source: "User",
    }
  );
  assert(skinToneEval.score >= 90, `Warm undertone correctly scored high harmony (${skinToneEval.score})`);

  // TEST 12: Calendar Event Match Scoring
  console.log("\nScenario 12: Calendar Event Match Scoring");
  const eventEval = marketplaceContextEngine.evaluateEventRelevance(
    {
      ...sampleProductA,
      category: "Ethnic Wear",
      title: "Royal Silk Kurta Set",
      occasion: "Wedding",
    },
    [
      {
        id: "evt_1",
        userId: userA,
        title: "Sister's Wedding Reception",
        date: new Date(Date.now() + 86400000 * 5).toISOString(),
        occasionType: "Weddings / Functions",
      } as any,
    ]
  );
  assert(eventEval.score >= 90, `Wedding event correctly matched wedding kurta (${eventEval.score})`);

  // TEST 13: Grounded OP AI Rationale Generation
  console.log("\nScenario 13: Grounded OP AI Rationale Generation (Zero Hallucination)");
  const groundedReason = marketplaceRetrievalEngine.generateGroundedRecommendationReason(
    sampleProductA,
    hoodieIntent,
    dummyProfile as any,
    [],
    []
  );
  assert(groundedReason.startsWith("Recommended"), "Grounded explanation starts with 'Recommended'");
  assert(groundedReason.length > 20, `Grounded explanation generated: '${groundedReason}'`);

  // TEST 14: Duplicate Detection & Redundancy Penalty
  console.log("\nScenario 14: Wardrobe Redundancy Detection");
  const saturatedWardrobe = [
    { id: "w_1", userId: userA, name: "Black Oxford Shirt", category: "Tops" as any, color: "Black", wearCount: 2 },
    { id: "w_2", userId: userA, name: "Black Cotton Tee", category: "Tops" as any, color: "Black", wearCount: 5 },
    { id: "w_3", userId: userA, name: "Black Linen Shirt", category: "Tops" as any, color: "Black", wearCount: 3 },
  ];
  const duplicateEval = marketplaceRetrievalEngine.evaluateDoINeedThis(
    {
      ...sampleProductA,
      title: "Black Plain T-Shirt",
      colors: ["Black"],
      category: "Tops",
    },
    saturatedWardrobe as any
  );
  assert(duplicateEval.duplicateCount >= 3, `Detected ${duplicateEval.duplicateCount} duplicate black tops`);
  assert(duplicateEval.verdict === "High Redundancy", "Flagged as 'High Redundancy'");

  // TEST 15: Multi-Provider Search Aggregation & 9 Sections Partitioning
  console.log("\nScenario 15: Aggregated Search & 9 Dynamic Sections");
  const aggResult = await marketplaceAggregator.searchAndRank(
    {
      rawQuery: "Linen Shirt",
      category: "Tops",
      subcategory: "Shirts",
      discoveredStyles: ["Shirts"],
      searchKeywords: "Linen Shirt",
    },
    { source: "All" },
    dummyProfile as any,
    userA
  );
  assert(aggResult.totalProducts > 0, `Aggregated search returned ${aggResult.totalProducts} products`);
  assert(aggResult.sections.pickedForYou.length > 0, "pickedForYou section populated");
  assert(aggResult.sections.bestMatch.length > 0, "bestMatch section populated");
  assert(aggResult.sections.bestValue.length > 0, "bestValue section populated");
  assert(aggResult.sections.costEffective.length > 0, "costEffective section populated");
  assert(aggResult.sections.highestRated.length > 0, "highestRated section populated");
  assert(aggResult.sections.popular.length > 0, "popular section populated");
  assert(aggResult.sections.styleMatch.length > 0, "styleMatch section populated");
  assert(aggResult.sections.wardrobeMatch.length > 0, "wardrobeMatch section populated");
  assert(aggResult.sections.eventMatch.length > 0, "eventMatch section populated");

  // TEST 16: Strict Relevance Category Filtering
  console.log("\nScenario 16: Strict Category Relevance Filtering");
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

  // TEST 17: Product Deduplication
  console.log("\nScenario 17: Product Deduplication");
  const duplicateList = [sampleProductA, sampleProductA, { ...sampleProductA, id: "loc_top_01_dup" }];
  const deduplicated = marketplaceAggregator.deduplicateProducts(duplicateList);
  assert(deduplicated.length === 1, `Deduplicated 3 identical items down to 1 (Count: ${deduplicated.length})`);

  // TEST 18: Summary & Exit
  console.log("\nScenario 18: Comprehensive Test Suite Summary");
  console.log(`Total Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);

  if (passedCount === totalCount) {
    console.log("\n=====================================================================");
    console.log("  🎉 ALL 18 REAL MARKETPLACE ACCEPTANCE SCENARIOS PASSED WITH 100%!   ");
    console.log("=====================================================================\n");
  } else {
    process.exit(1);
  }
}

runMasterMarketplaceTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

import { parseFashionSearchQuery } from "../src/lib/fashionSearchParser";
import { amazonMarketplaceProvider } from "../src/lib/marketplace/AmazonMarketplaceProvider";
import { flipkartMarketplaceProvider } from "../src/lib/marketplace/FlipkartMarketplaceProvider";
import { marketplaceAggregator } from "../src/lib/marketplace/MarketplaceAggregator";
import { generateAwsSigV4Headers } from "../src/lib/marketplace/awsSigV4";
import { MarketplaceProduct } from "../src/types/marketplace";
import { UserProfile } from "../src/types/user";

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
  console.log("RUNNING OP AI MARKETPLACE PROVIDER CONNECTION & HEALTH TESTS");
  console.log("==================================================================");

  // -------------------------------------------------------------
  // TEST GROUP 1: AWS SigV4 Cryptographic Request Signer
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 1: AWS Signature V4 Authentication Signer ---");

  const sigV4 = generateAwsSigV4Headers({
    accessKey: "AKIAIOSFODNN7EXAMPLE",
    secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    region: "eu-west-1",
    service: "ProductAdvertisingAPI",
    host: "webservices.amazon.in",
    path: "/paapi5/searchitems",
    payloadString: JSON.stringify({ Keywords: "dress", SearchIndex: "Apparel" }),
    targetHeader: "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
  });

  assert(
    typeof sigV4.authHeader === "string" &&
      sigV4.authHeader.startsWith("AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/"),
    "TEST 1.1: SigV4 generates compliant AWS4-HMAC-SHA256 authorization header"
  );
  assert(
    Boolean(sigV4.headers["x-amz-date"]) && Boolean(sigV4.headers["x-amz-target"]),
    "TEST 1.2: SigV4 sets required x-amz-date and x-amz-target headers"
  );
  assert(
    sigV4.headers["content-encoding"] === "amz-1.0" &&
      sigV4.headers["content-type"] === "application/json; charset=utf-8",
    "TEST 1.3: SigV4 sets correct PA-API content headers"
  );

  // -------------------------------------------------------------
  // TEST GROUP 2: Provider Status & Health Diagnostics
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Provider Status & Health Diagnostics ---");

  const amzStatus = amazonMarketplaceProvider.getStatus();
  assert(
    amzStatus.provider === "Amazon" && typeof amzStatus.isConfigured === "boolean",
    "TEST 2.1: Amazon provider status is reported accurately"
  );

  const fkStatus = flipkartMarketplaceProvider.getStatus();
  assert(
    fkStatus.provider === "Flipkart" && typeof fkStatus.isConfigured === "boolean",
    "TEST 2.2: Flipkart provider status is reported accurately"
  );

  const amzTest = await amazonMarketplaceProvider.testConnection();
  assert(
    amzTest.provider === "Amazon" && typeof amzTest.latencyMs === "number",
    "TEST 2.3: Amazon diagnostic test executes and reports latency"
  );

  const fkTest = await flipkartMarketplaceProvider.testConnection();
  assert(
    fkTest.provider === "Flipkart" && typeof fkTest.latencyMs === "number",
    "TEST 2.4: Flipkart diagnostic test executes and reports latency"
  );

  // -------------------------------------------------------------
  // TEST GROUP 3: Shopping Intent Natural Language Parsing
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Shopping Intent Natural Language Parsing ---");

  const qDress = parseFashionSearchQuery("Dress");
  assert(qDress.category === "Dresses", "TEST 3.1: 'Dress' -> Category: Dresses");

  const qWhiteShirt = parseFashionSearchQuery("White shirt");
  assert(
    qWhiteShirt.category === "Tops" && qWhiteShirt.color === "White",
    "TEST 3.2: 'White shirt' -> Category: Tops, Color: White"
  );

  const qBlackJeans = parseFashionSearchQuery("Black jeans");
  assert(
    qBlackJeans.category === "Bottoms" && qBlackJeans.color === "Black",
    "TEST 3.3: 'Black jeans' -> Category: Bottoms, Color: Black"
  );

  const qRedDress = parseFashionSearchQuery("Red dress");
  assert(
    qRedDress.category === "Dresses" && qRedDress.color === "Red",
    "TEST 3.4: 'Red dress' -> Category: Dresses, Color: Red"
  );

  const qFloralDress = parseFashionSearchQuery("Floral dress");
  assert(
    qFloralDress.category === "Dresses" && qFloralDress.pattern === "Floral",
    "TEST 3.5: 'Floral dress' -> Category: Dresses, Pattern: Floral"
  );

  const qBlackMaxi = parseFashionSearchQuery("Black maxi dress");
  assert(
    qBlackMaxi.category === "Dresses" &&
      qBlackMaxi.subcategory === "Maxi Dress" &&
      qBlackMaxi.color === "Black",
    "TEST 3.6: 'Black maxi dress' -> Category: Dresses, Subcategory: Maxi Dress, Color: Black"
  );

  const qPartyDress = parseFashionSearchQuery("Party dress under ₹2000");
  assert(
    qPartyDress.category === "Dresses" &&
      qPartyDress.occasion === "Party" &&
      qPartyDress.budget?.max === 2000,
    "TEST 3.7: 'Party dress under ₹2000' -> Category: Dresses, Occasion: Party, MaxPrice: 2000"
  );

  // -------------------------------------------------------------
  // TEST GROUP 4: Strict Deduplication & Relevance Filtering Engine
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Strict Deduplication & Relevance Filter ---");

  const testCandidates: MarketplaceProduct[] = [
    {
      id: "AMZ-001",
      provider: "Amazon",
      title: "Women's Solid White A-Line Dress",
      brand: "Zara",
      imageUrl: "https://m.media-amazon.com/images/I/white_dress.jpg",
      productUrl: "https://amazon.in/dp/AMZ-001",
      price: 1899,
      originalPrice: 2499,
      currency: "₹",
      discountPercent: 24,
      rating: 4.5,
      reviewCount: 320,
      category: "Dresses",
      gender: "Women",
      colors: ["White"],
    },
    {
      id: "AMZ-001", // Duplicate
      provider: "Amazon",
      title: "Women's Solid White A-Line Dress (Duplicate)",
      brand: "Zara",
      imageUrl: "https://m.media-amazon.com/images/I/white_dress.jpg",
      productUrl: "https://amazon.in/dp/AMZ-001",
      price: 1899,
      originalPrice: 2499,
      currency: "₹",
      discountPercent: 24,
      rating: 4.5,
      reviewCount: 320,
      category: "Dresses",
      gender: "Women",
      colors: ["White"],
    },
    {
      id: "AMZ-002",
      provider: "Amazon",
      title: "Men's Classic Solid White Slim Fit Shirt",
      brand: "Van Heusen",
      imageUrl: "https://m.media-amazon.com/images/I/white_shirt.jpg",
      productUrl: "https://amazon.in/dp/AMZ-002",
      price: 1299,
      originalPrice: 1799,
      currency: "₹",
      discountPercent: 28,
      rating: 4.3,
      reviewCount: 150,
      category: "Tops",
      gender: "Men",
      colors: ["White"],
    },
    {
      id: "AMZ-003",
      provider: "Amazon",
      title: "Men's Solid Black Formal Shirt",
      brand: "Peter England",
      imageUrl: "https://m.media-amazon.com/images/I/black_shirt.jpg",
      productUrl: "https://amazon.in/dp/AMZ-003",
      price: 1199,
      originalPrice: 1599,
      currency: "₹",
      discountPercent: 25,
      rating: 4.2,
      reviewCount: 90,
      category: "Tops",
      gender: "Men",
      colors: ["Black"],
    },
    {
      id: "FK-001",
      provider: "Flipkart",
      title: "Women's Floral Red Maxi Dress",
      brand: "Tokyo Talkies",
      imageUrl: "https://rukminim1.flixcart.com/image/800/800/red_dress.jpg",
      productUrl: "https://flipkart.com/p/FK-001",
      price: 1499,
      originalPrice: 2299,
      currency: "₹",
      discountPercent: 35,
      rating: 4.4,
      reviewCount: 450,
      category: "Dresses",
      subcategory: "Maxi Dress",
      gender: "Women",
      colors: ["Red"],
    },
    {
      id: "AMZ-004",
      provider: "Amazon",
      title: "Men's Slim Fit Black Denim Jeans",
      brand: "Levi's",
      imageUrl: "https://m.media-amazon.com/images/I/black_jeans.jpg",
      productUrl: "https://amazon.in/dp/AMZ-004",
      price: 2199,
      originalPrice: 2999,
      currency: "₹",
      discountPercent: 26,
      rating: 4.6,
      reviewCount: 520,
      category: "Bottoms",
      gender: "Men",
      colors: ["Black"],
    },
    {
      id: "AMZ-005",
      provider: "Amazon",
      title: "Women's Solid Black Tiered Maxi Dress",
      brand: "VERO MODA",
      imageUrl: "https://m.media-amazon.com/images/I/black_maxi.jpg",
      productUrl: "https://amazon.in/dp/AMZ-005",
      price: 1899,
      originalPrice: 2799,
      currency: "₹",
      discountPercent: 32,
      rating: 4.5,
      reviewCount: 210,
      category: "Dresses",
      subcategory: "Maxi Dress",
      gender: "Women",
      colors: ["Black"],
    },
  ];

  // 1. Deduplication
  const deduped = marketplaceAggregator.deduplicateProducts(testCandidates);
  assert(
    deduped.length === 6,
    "TEST 4.1: Deduplication strips duplicates (7 candidates -> 6 unique items)"
  );

  // 2. "White shirt" filter
  const whiteShirtResults = marketplaceAggregator.filterByRelevance(deduped, qWhiteShirt);
  assert(
    whiteShirtResults.length === 1 && whiteShirtResults[0].id === "AMZ-002",
    "TEST 4.2: 'White shirt' search retains White Shirt and DISCARDS Black Shirt & Dresses"
  );

  // 3. "Dress" filter
  const dressResults = marketplaceAggregator.filterByRelevance(deduped, qDress);
  assert(
    dressResults.length === 3 && dressResults.every((d) => d.category === "Dresses"),
    "TEST 4.3: 'Dress' search returns ONLY dresses and DISCARDS shirts & jeans"
  );

  // 4. "Red dress" filter
  const redDressResults = marketplaceAggregator.filterByRelevance(deduped, qRedDress);
  assert(
    redDressResults.length === 1 && redDressResults[0].id === "FK-001",
    "TEST 4.4: 'Red dress' search returns ONLY red dress and DISCARDS non-red items"
  );

  // 5. "Black jeans" filter
  const blackJeansResults = marketplaceAggregator.filterByRelevance(deduped, qBlackJeans);
  assert(
    blackJeansResults.length === 1 && blackJeansResults[0].id === "AMZ-004",
    "TEST 4.5: 'Black jeans' search returns ONLY black jeans and DISCARDS dresses and shirts"
  );

  // 6. "Black maxi dress" filter
  const blackMaxiResults = marketplaceAggregator.filterByRelevance(deduped, qBlackMaxi);
  assert(
    blackMaxiResults.length === 1 && blackMaxiResults[0].id === "AMZ-005",
    "TEST 4.6: 'Black maxi dress' search returns ONLY black maxi dress"
  );

  // 7. "Party dress under ₹2000" budget filter
  const partyDressResults = marketplaceAggregator.filterByRelevance(deduped, qPartyDress);
  assert(
    partyDressResults.every((d) => d.price <= 2000),
    "TEST 4.7: 'Party dress under ₹2000' search enforces maxPrice ₹2000"
  );

  // -------------------------------------------------------------
  // TEST GROUP 5: Aggregator Provider Status & Section Health
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Aggregator Provider Health & Status ---");

  const mockUser: UserProfile = {
    id: "user-1",
    name: "Hero",
    email: "hero@omnipresence.ai",
    gender: "Women",
    stylePreferences: ["Elegant", "Minimal"],
    preferredBrands: ["Zara"],
    appearance: {
      skinTone: {
        paletteId: "st-5",
        hex: "#C58C68",
        name: "Warm Beige",
        undertone: "Warm",
        source: "User",
      },
    },
  } as unknown as UserProfile;

  const response = await marketplaceAggregator.searchAndRank(qDress, { gender: "Women" }, mockUser);
  assert(
    Array.isArray(response.providerStatuses) && response.providerStatuses.length === 2,
    "TEST 5.1: Aggregator exposes live provider statuses array"
  );
  assert(
    typeof response.hasConnectedProviders === "boolean",
    "TEST 5.2: Aggregator reports hasConnectedProviders boolean for UI consumption"
  );
  assert(
    Array.isArray(response.sections.bestMatch) &&
      Array.isArray(response.sections.bestForYou) &&
      Array.isArray(response.sections.costEffective) &&
      Array.isArray(response.sections.highestRated),
    "TEST 5.3: Aggregator sections are structured correctly"
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(
    `TOTAL MARKETPLACE TESTS PASSED: ${passed}/${passed + failed} (${Math.round(
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

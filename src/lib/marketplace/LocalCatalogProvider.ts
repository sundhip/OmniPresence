import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceProviderName,
  MarketplaceProviderStatus,
  MarketplaceProviderTestResult,
  MarketplaceProviderHealthStatus,
} from "@/types/marketplace";
import { IMarketplaceProvider } from "./MarketplaceProvider";

export const LOCAL_MARKETPLACE_CATALOG: MarketplaceProduct[] = [
  // -------------------------------------------------------------
  // TOPS
  // -------------------------------------------------------------
  {
    id: "loc_top_01",
    provider: "Local",
    providerProductId: "dev_sku_1001",
    title: "Classic White Linen Button-Down Shirt",
    description: "Breathable pure French linen shirt with a tailored spread collar and relaxed drape.",
    brand: "Linen & Co",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/classic-white-linen-shirt",
    price: 1899,
    originalPrice: 2499,
    currency: "INR",
    discountPercent: 24,
    discountPercentage: 24,
    priceStatus: "development",
    rating: 4.6,
    reviewCount: 142,
    availability: "in_stock",
    category: "Tops",
    subcategory: "Shirts",
    colors: ["White"],
    sizes: ["S", "M", "L", "XL"],
    material: "100% Pure Linen",
    pattern: "Solid",
    fit: "Regular",
    style: "Smart Casual",
    occasion: "Casual, Office, Summer",
    season: "Summer, Spring",
    gender: "Unisex",
    source: "local",
    features: ["Breathable French Linen", "Spread Collar", "Mother of Pearl Buttons"],
    deliveryInformation: "Standard Delivery (2-3 days)",
    isBestSeller: true,
  },
  {
    id: "loc_top_02",
    provider: "Local",
    providerProductId: "dev_sku_1002",
    title: "Oversized Heavyweight Cotton T-Shirt",
    description: "240 GSM organic combed cotton t-shirt with dropped shoulder seams and relaxed boxy cut.",
    brand: "StreetMinimal",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/oversized-black-tshirt",
    price: 899,
    originalPrice: 1299,
    currency: "INR",
    discountPercent: 30,
    discountPercentage: 30,
    priceStatus: "development",
    rating: 4.8,
    reviewCount: 310,
    availability: "in_stock",
    category: "Tops",
    subcategory: "T-Shirts",
    colors: ["Black"],
    sizes: ["M", "L", "XL", "XXL"],
    material: "100% Combed Organic Cotton",
    pattern: "Solid",
    fit: "Oversized",
    style: "Streetwear",
    occasion: "Casual, Daily",
    season: "All-Season",
    gender: "Unisex",
    source: "local",
    features: ["240 GSM Heavyweight Cotton", "Drop Shoulder", "Pre-shrunk fabric"],
    deliveryInformation: "Free Express Delivery",
    isBestSeller: true,
  },
  {
    id: "loc_top_03",
    provider: "Local",
    providerProductId: "dev_sku_1003",
    title: "Slim-Fit Crimson Red Oxford Shirt",
    description: "Tailored Oxford cloth shirt in deep crimson red, perfect for smart casual styling.",
    brand: "Oxford Studio",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/red-oxford-shirt",
    price: 1399,
    originalPrice: 1999,
    currency: "INR",
    discountPercent: 30,
    discountPercentage: 30,
    priceStatus: "development",
    rating: 4.5,
    reviewCount: 88,
    availability: "in_stock",
    category: "Tops",
    subcategory: "Shirts",
    colors: ["Red", "Crimson"],
    sizes: ["S", "M", "L"],
    material: "100% Oxford Cotton",
    pattern: "Solid",
    fit: "Slim",
    style: "Smart Casual",
    occasion: "Casual, Party, Evening",
    season: "Autumn, Winter",
    gender: "Men",
    source: "local",
    features: ["Pinpoint Oxford Weave", "Button-Down Collar", "Wrinkle Resistant"],
    deliveryInformation: "Standard Delivery (2-4 days)",
  },
  {
    id: "loc_top_04",
    provider: "Local",
    providerProductId: "dev_sku_1004",
    title: "Merino Wool Fine-Knit Crewneck Sweater",
    description: "Ultra-fine Australian merino wool knit sweater with ribbed cuffs and hem.",
    brand: "Nordic Atelier",
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/merino-wool-sweater",
    price: 2499,
    originalPrice: 3499,
    currency: "INR",
    discountPercent: 28,
    discountPercentage: 28,
    priceStatus: "development",
    rating: 4.9,
    reviewCount: 64,
    availability: "in_stock",
    category: "Tops",
    subcategory: "Sweaters",
    colors: ["Navy", "Charcoal"],
    sizes: ["M", "L", "XL"],
    material: "100% Merino Wool",
    pattern: "Solid",
    fit: "Regular",
    style: "Minimalist",
    occasion: "Formal, Office, Winter",
    season: "Winter, Autumn",
    gender: "Unisex",
    source: "local",
    features: ["Extra-Fine Merino Wool", "Temperature Regulating", "Ribbed Trims"],
  },

  // -------------------------------------------------------------
  // BOTTOMS
  // -------------------------------------------------------------
  {
    id: "loc_bottom_01",
    provider: "Local",
    providerProductId: "dev_sku_2001",
    title: "Tailored Slim Navy Chinos",
    description: "Stretch cotton twill chinos tailored for a clean tapered leg silhouette.",
    brand: "TailorFit",
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/tailored-navy-chinos",
    price: 1699,
    originalPrice: 2299,
    currency: "INR",
    discountPercent: 26,
    discountPercentage: 26,
    priceStatus: "development",
    rating: 4.7,
    reviewCount: 220,
    availability: "in_stock",
    category: "Bottoms",
    subcategory: "Chinos",
    colors: ["Navy"],
    sizes: ["30", "32", "34", "36"],
    material: "98% Cotton, 2% Elastane",
    pattern: "Solid",
    fit: "Slim",
    style: "Smart Casual",
    occasion: "Office, Casual, Evening",
    season: "All-Season",
    gender: "Men",
    source: "local",
    features: ["2-Way Stretch Twill", "Slanted Side Pockets", "Reinforced Seams"],
    isBestSeller: true,
  },
  {
    id: "loc_bottom_02",
    provider: "Local",
    providerProductId: "dev_sku_2002",
    title: "Classic Indigo Selvedge Raw Denim Jeans",
    description: "13.5 oz Japanese selvedge denim with straight leg cut and clean contrast stitching.",
    brand: "DenimCraft",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/raw-selvedge-jeans",
    price: 2199,
    originalPrice: 2999,
    currency: "INR",
    discountPercent: 26,
    discountPercentage: 26,
    priceStatus: "development",
    rating: 4.8,
    reviewCount: 175,
    availability: "in_stock",
    category: "Bottoms",
    subcategory: "Jeans",
    colors: ["Blue", "Indigo"],
    sizes: ["30", "32", "34", "36"],
    material: "100% Selvedge Cotton",
    pattern: "Solid",
    fit: "Straight",
    style: "Classic",
    occasion: "Casual, Daily",
    season: "All-Season",
    gender: "Unisex",
    source: "local",
    features: ["13.5oz Raw Denim", "Red Line Selvedge ID", "Custom Brass Hardware"],
  },
  {
    id: "loc_bottom_03",
    provider: "Local",
    providerProductId: "dev_sku_2003",
    title: "Slim Tapered Jet Black Jeans",
    description: "Deep jet black denim with stay-black color retention technology and comfortable stretch.",
    brand: "UrbanDenim",
    imageUrl: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/jet-black-jeans",
    price: 1499,
    originalPrice: 1999,
    currency: "INR",
    discountPercent: 25,
    discountPercentage: 25,
    priceStatus: "development",
    rating: 4.6,
    reviewCount: 198,
    availability: "in_stock",
    category: "Bottoms",
    subcategory: "Jeans",
    colors: ["Black"],
    sizes: ["28", "30", "32", "34", "36"],
    material: "98% Cotton, 2% Spandex",
    pattern: "Solid",
    fit: "Slim",
    style: "Street Casual",
    occasion: "Casual, Party, Night Out",
    season: "All-Season",
    gender: "Unisex",
    source: "local",
    features: ["Stay-Black Dye Tech", "Comfort Flex Waistband", "Tapered Ankle"],
  },

  // -------------------------------------------------------------
  // DRESSES & FULL BODY
  // -------------------------------------------------------------
  {
    id: "loc_dress_01",
    provider: "Local",
    providerProductId: "dev_sku_3001",
    title: "Floral Tiered Bohemian Maxi Dress",
    description: "Flowing botanical floral print maxi dress with tiered A-line skirt and delicate flutter sleeves.",
    brand: "Flora Atelier",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/floral-maxi-dress",
    price: 1999,
    originalPrice: 2899,
    currency: "INR",
    discountPercent: 31,
    discountPercentage: 31,
    priceStatus: "development",
    rating: 4.9,
    reviewCount: 260,
    availability: "in_stock",
    category: "Dresses",
    subcategory: "Maxi Dress",
    colors: ["Floral", "Red", "Multi"],
    sizes: ["XS", "S", "M", "L"],
    material: "Georgette with Soft Cotton Lining",
    pattern: "Floral",
    fit: "A-Line",
    style: "Boho Chic",
    occasion: "Party, Wedding, Vacation, Summer",
    season: "Summer, Spring",
    gender: "Women",
    source: "local",
    features: ["Tiered Flounce Skirt", "V-Neckline with Ties", "Fully Lined"],
    isBestSeller: true,
  },
  {
    id: "loc_dress_02",
    provider: "Local",
    providerProductId: "dev_sku_3002",
    title: "Emerald Silk Satin Slip Dress",
    description: "Bias-cut lustrous silk satin midi dress with cowl neckline and elegant side slit.",
    brand: "Lumiere Evening",
    imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/emerald-satin-dress",
    price: 2599,
    originalPrice: 3599,
    currency: "INR",
    discountPercent: 27,
    discountPercentage: 27,
    priceStatus: "development",
    rating: 4.8,
    reviewCount: 95,
    availability: "in_stock",
    category: "Dresses",
    subcategory: "Slip Dress",
    colors: ["Green", "Emerald"],
    sizes: ["S", "M", "L"],
    material: "Silk Satin Blend",
    pattern: "Solid",
    fit: "Slim",
    style: "Elegant Cocktail",
    occasion: "Party, Wedding Reception, Gala, Evening",
    season: "All-Season",
    gender: "Women",
    source: "local",
    features: ["Bias-Cut Draping", "Cowl Neckline", "Adjustable Straps"],
  },

  // -------------------------------------------------------------
  // OUTERWEAR
  // -------------------------------------------------------------
  {
    id: "loc_outer_01",
    provider: "Local",
    providerProductId: "dev_sku_4001",
    title: "Tailored Charcoal Wool-Blend Blazer",
    description: "Modern single-breasted blazer with notch lapels, structured shoulders, and partial satin lining.",
    brand: "Sartorial",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/charcoal-wool-blazer",
    price: 3499,
    originalPrice: 4999,
    currency: "INR",
    discountPercent: 30,
    discountPercentage: 30,
    priceStatus: "development",
    rating: 4.9,
    reviewCount: 110,
    availability: "in_stock",
    category: "Outerwear",
    subcategory: "Blazers",
    colors: ["Charcoal", "Grey"],
    sizes: ["38", "40", "42", "44"],
    material: "60% Wool, 40% Viscose",
    pattern: "Solid",
    fit: "Tailored",
    style: "Formal Business",
    occasion: "Formal, Office, Presentation, Wedding",
    season: "Autumn, Winter",
    gender: "Unisex",
    source: "local",
    features: ["Notch Lapels", "Interior Pockets", "Vent at Back"],
  },
  {
    id: "loc_outer_02",
    provider: "Local",
    providerProductId: "dev_sku_4002",
    title: "Classic Vintage Denim Trucker Jacket",
    description: "12 oz stonewashed cotton denim jacket with twin chest pockets and brass button placket.",
    brand: "Heritage Denim",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/denim-trucker-jacket",
    price: 2299,
    originalPrice: 2999,
    currency: "INR",
    discountPercent: 23,
    discountPercentage: 23,
    priceStatus: "development",
    rating: 4.7,
    reviewCount: 180,
    availability: "in_stock",
    category: "Outerwear",
    subcategory: "Jackets",
    colors: ["Blue", "Light Blue"],
    sizes: ["S", "M", "L", "XL"],
    material: "100% Cotton Denim",
    pattern: "Solid",
    fit: "Regular",
    style: "Casual Americana",
    occasion: "Casual, Weekend, Outing",
    season: "Spring, Autumn",
    gender: "Unisex",
    source: "local",
    features: ["12oz Stonewash Denim", "Twin Flap Pockets", "Adjustable Waist Tabs"],
  },

  // -------------------------------------------------------------
  // FOOTWEAR
  // -------------------------------------------------------------
  {
    id: "loc_shoes_01",
    provider: "Local",
    providerProductId: "dev_sku_5001",
    title: "Minimalist White Full-Grain Leather Sneakers",
    description: "Handcrafted Italian full-grain leather low-top sneakers with vulcanized rubber cupsole.",
    brand: "Avenue Kicks",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/white-leather-sneakers",
    price: 2799,
    originalPrice: 3799,
    currency: "INR",
    discountPercent: 26,
    discountPercentage: 26,
    priceStatus: "development",
    rating: 4.9,
    reviewCount: 340,
    availability: "in_stock",
    category: "Shoes",
    subcategory: "Sneakers",
    colors: ["White"],
    sizes: ["7", "8", "9", "10", "11"],
    material: "Full-Grain Calfskin Leather",
    pattern: "Solid",
    fit: "Regular",
    style: "Minimalist Luxe",
    occasion: "Casual, Smart Casual, Daily",
    season: "All-Season",
    gender: "Unisex",
    source: "local",
    features: ["Orthopedic Memory Foam Insole", "Vulcanized Rubber Sole", "Hand-Stitched"],
    isBestSeller: true,
  },
  {
    id: "loc_shoes_02",
    provider: "Local",
    providerProductId: "dev_sku_5002",
    title: "Suede Penny Loafers in Rich Tan",
    description: "Supple Italian calf suede slip-on loafers with tonal saddle strap and Goodyear welted sole.",
    brand: "Cobbler Studio",
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/suede-tan-loafers",
    price: 2999,
    originalPrice: 3999,
    currency: "INR",
    discountPercent: 25,
    discountPercentage: 25,
    priceStatus: "development",
    rating: 4.7,
    reviewCount: 92,
    availability: "in_stock",
    category: "Shoes",
    subcategory: "Loafers",
    colors: ["Tan", "Brown", "Beige"],
    sizes: ["8", "9", "10", "11"],
    material: "Calf Suede",
    pattern: "Solid",
    fit: "Regular",
    style: "Smart Casual",
    occasion: "Formal, Office, Wedding, Smart Casual",
    season: "All-Season",
    gender: "Men",
    source: "local",
    features: ["Goodyear Welted", "Supple Calf Suede", "Leather Insole"],
  },

  // -------------------------------------------------------------
  // ACCESSORIES
  // -------------------------------------------------------------
  {
    id: "loc_acc_01",
    provider: "Local",
    providerProductId: "dev_sku_6001",
    title: "Minimalist Bauhaus Chronograph Watch",
    description: "40mm sapphire crystal case with genuine leather strap and Japanese quartz movement.",
    brand: "Horology Co",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    productUrl: "https://example.com/products/minimalist-bauhaus-watch",
    price: 3299,
    originalPrice: 4499,
    currency: "INR",
    discountPercent: 26,
    discountPercentage: 26,
    priceStatus: "development",
    rating: 4.8,
    reviewCount: 145,
    availability: "in_stock",
    category: "Accessories",
    subcategory: "Watches",
    colors: ["Silver", "Black", "Brown"],
    sizes: ["40mm"],
    material: "316L Stainless Steel & Leather",
    pattern: "Solid",
    fit: "Universal",
    style: "Minimalist",
    occasion: "Formal, Casual, Daily",
    season: "All-Season",
    gender: "Unisex",
    source: "local",
    features: ["5 ATM Water Resistant", "Sapphire Crystal Glass", "Interchangeable Strap"],
  },
];

/**
 * Local Development Catalog Provider
 * Returns normalized products with source="local" and provider="Local".
 * Operates offline with zero external API key requirements.
 */
export class LocalCatalogProvider implements IMarketplaceProvider {
  public readonly name: MarketplaceProviderName = "Local";
  public readonly status: MarketplaceProviderHealthStatus = "ACTIVE";

  public isConfigured(): boolean {
    return true;
  }

  public getStatus(): MarketplaceProviderStatus {
    return {
      provider: "Local",
      isConfigured: true,
      isConnected: true,
      status: "ACTIVE",
      message: "Local Development Catalog active with 12 baseline items",
      lastChecked: new Date().toISOString(),
    };
  }

  public async testConnection(): Promise<MarketplaceProviderTestResult> {
    return {
      provider: "Local",
      passed: true,
      status: "ACTIVE",
      latencyMs: 1,
      statusCode: 200,
      productCount: LOCAL_MARKETPLACE_CATALOG.length,
      sampleProduct: {
        id: LOCAL_MARKETPLACE_CATALOG[0].id,
        title: LOCAL_MARKETPLACE_CATALOG[0].title,
        price: LOCAL_MARKETPLACE_CATALOG[0].price,
        imageUrl: LOCAL_MARKETPLACE_CATALOG[0].imageUrl,
        productUrl: LOCAL_MARKETPLACE_CATALOG[0].productUrl,
      },
    };
  }

  public async searchProducts(
    query: FashionParsedQuery,
    filters?: MarketplaceSearchFilters
  ): Promise<MarketplaceProduct[]> {
    const rawQ = query.rawQuery.toLowerCase().trim();
    const targetCat = (query.category || "").toLowerCase();
    const targetSub = (query.subcategory || query.style || "").toLowerCase();
    const targetColor = (filters?.selectedColors?.[0] || query.color || "").toLowerCase();
    const maxBudget = filters?.maxPrice || query.budget?.max;
    const minBudget = filters?.minPrice || query.budget?.min;

    return LOCAL_MARKETPLACE_CATALOG.filter((p) => {
      const titleLower = p.title.toLowerCase();
      const catLower = (p.category || "").toLowerCase();
      const subLower = (p.subcategory || "").toLowerCase();
      const descLower = (p.description || "").toLowerCase();
      const colorLower = (p.colors || []).map((c) => c.toLowerCase());

      // 1. Budget Filter
      if (maxBudget !== undefined && p.price > maxBudget) return false;
      if (minBudget !== undefined && p.price < minBudget) return false;

      // 2. Category Match
      if (targetCat) {
        const matchesCategory =
          catLower.includes(targetCat) ||
          targetCat.includes(catLower) ||
          titleLower.includes(targetCat) ||
          (targetCat === "dresses" && (catLower.includes("dress") || titleLower.includes("dress")));

        if (!matchesCategory) return false;
      }

      // 3. Color Match
      if (targetColor) {
        const matchesColor =
          colorLower.some((c) => c.includes(targetColor) || targetColor.includes(c)) ||
          titleLower.includes(targetColor);
        if (!matchesColor) return false;
      }

      // 4. Subcategory / Specific style
      if (targetSub) {
        const matchesSub =
          subLower.includes(targetSub) ||
          titleLower.includes(targetSub) ||
          descLower.includes(targetSub);
        if (!matchesSub) return false;
      }

      // 5. Keyword search query fallback
      if (!targetCat && !targetColor && rawQ && rawQ !== "all") {
        const matchesKeyword =
          titleLower.includes(rawQ) ||
          catLower.includes(rawQ) ||
          subLower.includes(rawQ) ||
          descLower.includes(rawQ);
        if (!matchesKeyword) return false;
      }

      return true;
    });
  }

  public async getProduct(id: string): Promise<MarketplaceProduct | null> {
    return LOCAL_MARKETPLACE_CATALOG.find((p) => p.id === id) || null;
  }

  public async getCategories(): Promise<string[]> {
    return Array.from(new Set(LOCAL_MARKETPLACE_CATALOG.map((p) => p.category)));
  }

  public generateAffiliateUrl(product: MarketplaceProduct): string {
    return product.productUrl;
  }
}

export const localCatalogProvider = new LocalCatalogProvider();

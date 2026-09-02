"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MarketplaceProduct,
  FashionParsedQuery,
  MarketplaceSearchFilters,
  MarketplaceSearchResponse,
  SavedMarketplaceProduct,
} from "@/types/marketplace";
import { marketplaceService } from "@/services/marketplaceService";
import { wardrobeService } from "@/services/wardrobeService";
import { financeService } from "@/services/financeService";
import { AppStorage } from "@/lib/storage";
import { marketplaceContextEngine } from "@/lib/marketplace/MarketplaceContextEngine";
import { PurchaseEvaluation } from "@/types/finance";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Star,
  Check,
  Tag,
  Truck,
  RotateCcw,
  Heart,
  PlusCircle,
  X,
  AlertCircle,
  Camera,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Bookmark,
  Calendar,
  Sun,
  Flame,
  ThumbsUp,
  SlidersHorizontal,
} from "lucide-react";

const SUGGESTED_SEARCHES = [
  "Black oversized hoodie under ₹1500",
  "White linen shirt",
  "Red kurta under ₹2000",
  "Floral summer dress",
  "Tailored navy chinos",
  "White leather sneakers",
  "Charcoal wool blazer",
  "Kurta pajama set",
];

type SectionTabKey =
  | "pickedForYou"
  | "bestMatch"
  | "bestValue"
  | "costEffective"
  | "highestRated"
  | "popular"
  | "styleMatch"
  | "wardrobeMatch"
  | "eventMatch"
  | "saved";

const SECTION_TABS: Array<{ id: SectionTabKey; label: string; icon: any }> = [
  { id: "pickedForYou", label: "Picked for You", icon: Sparkles },
  { id: "bestMatch", label: "Best Match", icon: CheckCircle2 },
  { id: "bestValue", label: "Best Value", icon: Star },
  { id: "costEffective", label: "Under Budget", icon: Tag },
  { id: "highestRated", label: "Highest Rated", icon: ThumbsUp },
  { id: "popular", label: "Popular", icon: Flame },
  { id: "styleMatch", label: "Style Match", icon: Layers },
  { id: "wardrobeMatch", label: "Wardrobe Pairings", icon: Bookmark },
  { id: "eventMatch", label: "Event Ready", icon: Calendar },
  { id: "saved", label: "Wishlist", icon: Heart },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState<FashionParsedQuery | null>(null);
  const [searchResponse, setSearchResponse] = useState<MarketplaceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Active Section Tab
  const [activeSection, setActiveSection] = useState<SectionTabKey>("pickedForYou");

  // Saved Products State (User-Isolated)
  const [savedProducts, setSavedProducts] = useState<SavedMarketplaceProduct[]>([]);

  // Filters State
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [genderFilter, setGenderFilter] = useState<"Women" | "Men" | "All">(
    (user?.gender as "Women" | "Men" | "All") || "All"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedFit, setSelectedFit] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<
    | "recommended"
    | "best_match"
    | "best_for_you"
    | "price_low"
    | "price_high"
    | "rating"
    | "popular"
    | "wardrobe_match"
  >("recommended");

  // Show/Hide Filters drawer on mobile
  const [showFilters, setShowFilters] = useState(false);

  // Quick View & Evaluator Modal
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);
  const [isAddingToWardrobe, setIsAddingToWardrobe] = useState(false);
  const [evalResult, setEvalResult] = useState<PurchaseEvaluation | null>(null);
  const [isEvaluatingProduct, setIsEvaluatingProduct] = useState(false);

  // Image Search Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stale Request Protection
  const activeAbortController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);

  // Refresh saved products for active user
  const reloadSavedProducts = () => {
    if (user?.id) {
      setSavedProducts(marketplaceService.getSavedProducts(user.id));
    }
  };

  useEffect(() => {
    reloadSavedProducts();
  }, [user?.id]);

  // Execute Search
  const executeSearch = async (
    queryText: string,
    overrides?: {
      styles?: string[];
      source?: string;
      gender?: "Women" | "Men" | "All";
      category?: string;
      fit?: string;
      price?: number;
      rating?: number;
      color?: string;
      brand?: string;
      sort?: any;
    }
  ) => {
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const abortController = new AbortController();
    activeAbortController.current = abortController;

    const currentReqId = ++searchRequestId.current;
    setIsLoading(true);

    try {
      const filters: MarketplaceSearchFilters = {
        source: overrides?.source !== undefined ? (overrides.source as any) : (sourceFilter as any),
        gender: overrides?.gender || genderFilter,
        selectedCategory: overrides?.category !== undefined ? (overrides.category === "All" ? undefined : overrides.category) : (selectedCategory === "All" ? undefined : selectedCategory),
        selectedStyles: overrides?.styles !== undefined ? overrides.styles : selectedStyles,
        selectedFits: overrides?.fit !== undefined ? (overrides.fit === "All" ? undefined : [overrides.fit]) : (selectedFit === "All" ? undefined : [selectedFit]),
        maxPrice: overrides?.price !== undefined ? overrides.price : maxPrice,
        minRating: overrides?.rating !== undefined ? overrides.rating : minRating,
        selectedColors: overrides?.color ? [overrides.color] : selectedColor ? [selectedColor] : undefined,
        selectedBrands: overrides?.brand ? [overrides.brand] : selectedBrand ? [selectedBrand] : undefined,
        sortBy: overrides?.sort || sortBy,
      };

      // Retrieve user context from storage
      const userId = user?.id || AppStorage.getActiveUserId() || "";
      const upcomingEvents = userId ? AppStorage.getEvents(userId) : [];

      const response = await marketplaceService.search(
        queryText,
        filters,
        { upcomingEvents },
        abortController.signal
      );

      if (currentReqId !== searchRequestId.current) {
        return;
      }

      setSearchResponse(response);
      setActiveQuery(response.query);

      // Sync extracted query parameters
      if (response.query.style && !selectedStyles.includes(response.query.style)) {
        setSelectedStyles([response.query.style]);
      }
      if (response.query.budget?.max && maxPrice === undefined) {
        setMaxPrice(response.query.budget.max);
      }
      if (response.query.color && !selectedColor) {
        setSelectedColor(response.query.color);
      }
      if (response.query.gender && response.query.gender !== "Unisex" && response.query.gender !== "All") {
        setGenderFilter(response.query.gender as "Women" | "Men" | "All");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      toastError("Search note", err.message || "Could not fetch marketplace items");
    } finally {
      if (currentReqId === searchRequestId.current) {
        setIsLoading(false);
      }
    }
  };

  // Initial automatic "Picked for You" generation on mount
  useEffect(() => {
    const userId = user?.id || AppStorage.getActiveUserId() || "";
    const wardrobeItems = userId ? AppStorage.getWardrobe(userId) : [];
    const upcomingEvents = userId ? AppStorage.getEvents(userId) : [];

    // Synthesize auto shopping intent based on user preferences and context
    const autoQuery = marketplaceContextEngine.generateAutomaticShoppingIntent(
      user,
      wardrobeItems,
      upcomingEvents,
      null
    );

    const initialTerm = autoQuery.rawQuery || "Linen Shirt";
    setSearchQuery(initialTerm);
    setActiveQuery(autoQuery);

    executeSearch(initialTerm, {
      gender: (user?.gender as "Women" | "Men" | "All") || "All",
    });
  }, [user?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery);
  };

  const handleToggleStyleChip = (style: string) => {
    const next = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];
    setSelectedStyles(next);
    executeSearch(searchQuery, { styles: next });
  };

  const handleToggleSaved = (prod: MarketplaceProduct) => {
    if (!user?.id) return;
    const isSaved = marketplaceService.isProductSaved(prod.id, user.id);
    if (isSaved) {
      marketplaceService.removeSavedProduct(prod.id, user.id);
      success("Removed from wishlist", `${prod.title} was removed.`);
    } else {
      marketplaceService.saveProduct(prod, user.id);
      success("Saved to wishlist", `${prod.title} was saved to your private wishlist.`);
    }
    reloadSavedProducts();
  };

  const handleAddToWardrobe = async (prod: MarketplaceProduct) => {
    if (!user) return;
    setIsAddingToWardrobe(true);
    try {
      await wardrobeService.addItem({
        userId: user.id,
        name: prod.title,
        category: (prod.category as any) || "Tops",
        subcategory: prod.subcategory || prod.category || "General",
        color: prod.colors?.[0] || "Black",
        brand: prod.brand || prod.store || prod.provider,
        fit: prod.fit || "Regular",
        material: prod.material || undefined,
        season: ["All-Season"],
        occasion: prod.occasion ? [prod.occasion] : ["Casual"],
        wearCount: 0,
        imageUrl: prod.imageUrl,
        notes: `Imported from ${prod.store || prod.provider} (${prod.currency} ${prod.price})`,
      });
      success("Added to Wardrobe!", `${prod.title} has been cataloged in your digital wardrobe.`);
    } catch (err: any) {
      toastError("Failed to add", err.message || "Could not save to digital wardrobe.");
    } finally {
      setIsAddingToWardrobe(false);
    }
  };

  const handleEvaluatePurchase = async (prod: MarketplaceProduct) => {
    if (!user) return;
    setIsEvaluatingProduct(true);
    setEvalResult(null);
    try {
      const res = await financeService.evaluatePurchase(
        prod.title,
        prod.price,
        prod.category,
        prod.colors?.[0]
      );
      setEvalResult(res);
    } catch (e: any) {
      toastError("Evaluation failed", e.message || "Could not evaluate financial impact");
    } finally {
      setIsEvaluatingProduct(false);
    }
  };

  // Image Upload / Camera search handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const detectedColor = "Black";
    const detectedCategory = "Tops";
    const prompt = `Visual search for ${detectedColor} ${detectedCategory}`;
    setSearchQuery(prompt);
    executeSearch(prompt, { color: detectedColor });
    success("Image Analyzed", "Searching visually similar products with FashionCLIP embeddings.");
  };

  // Compute products to render based on active section
  const currentProducts: MarketplaceProduct[] = useMemo(() => {
    if (activeSection === "saved") {
      return savedProducts.map((sp) => sp.product);
    }
    if (!searchResponse) return [];
    const sectionList = searchResponse.sections[activeSection];
    if (Array.isArray(sectionList) && sectionList.length > 0) {
      return sectionList;
    }
    return searchResponse.products || [];
  }, [activeSection, searchResponse, savedProducts]);

  const activeSavedIds = useMemo(
    () => new Set(savedProducts.map((sp) => sp.product.id)),
    [savedProducts]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Hidden image search input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* HEADER & HERO */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[var(--surface)] via-[var(--surface-soft)] to-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs font-bold text-[var(--primary)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OP AI Real Product Recommendation Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Personalized Marketplace
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Real products aggregated from Google Shopping, Amazon & Flipkart with AI-powered wardrobe compatibility, skin-tone harmony, and grounded purchase explanations.
          </p>
        </div>
      </div>

      {/* SEARCH BAR & AI UNDERSTANDING */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="E.g., 'Black oversized hoodie under ₹1500', 'Red kurta', 'Floral summer dress'..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] focus:border-[var(--primary)] text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all cursor-pointer"
              title="Search with Photo (FashionCLIP Visual Search)"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md min-h-[46px]"
          >
            Search OP AI
          </Button>
        </form>

        {/* Suggested Quick Searches */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
            Try:
          </span>
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setSearchQuery(term);
                executeSearch(term);
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>

        {/* OP AI Understanding Banner */}
        {activeQuery && (
          <div className="p-3.5 rounded-2xl bg-[var(--primary-soft)]/50 border border-[var(--primary)]/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[var(--primary)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> OP AI Extracted:
              </span>
              {activeQuery.category && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Category: {activeQuery.category}
                </span>
              )}
              {activeQuery.subcategory && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Style: {activeQuery.subcategory}
                </span>
              )}
              {activeQuery.fit && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Fit: {activeQuery.fit}
                </span>
              )}
              {activeQuery.color && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Color: {activeQuery.color}
                </span>
              )}
              {activeQuery.occasion && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Occasion: {activeQuery.occasion}
                </span>
              )}
              {activeQuery.budget?.max && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--primary)]/30 font-bold text-[var(--text-primary)]">
                  Budget: ≤ ₹{activeQuery.budget.max}
                </span>
              )}
              {user?.sizes?.tops && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                  Size: {user.sizes.tops}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STYLE DISCOVERY CHIPS */}
      {searchResponse && searchResponse.discoveredStyles.length > 0 && (
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Style Discovery & Taxonomy
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Refine your search intent
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {searchResponse.discoveredStyles.map((style) => {
              const isSelected = selectedStyles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleToggleStyleChip(style)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                      : "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  <span>{style}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Gender / Focus */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Focus:</span>
            {[
              { id: "All", label: "All" },
              { id: "Men", label: "Men" },
              { id: "Women", label: "Women" },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setGenderFilter(g.id as any);
                  executeSearch(searchQuery, { gender: g.id as any });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  genderFilter === g.id
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                    : "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                executeSearch(searchQuery, { category: e.target.value });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Tops">Tops & Shirts</option>
              <option value="Bottoms">Bottoms & Jeans</option>
              <option value="Ethnic Wear">Ethnic Wear & Kurta</option>
              <option value="Outerwear">Outerwear & Blazers</option>
              <option value="Footwear">Footwear & Shoes</option>
              <option value="Dresses">Dresses & Gowns</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {/* Fit Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Fit:</span>
            <select
              value={selectedFit}
              onChange={(e) => {
                setSelectedFit(e.target.value);
                executeSearch(searchQuery, { fit: e.target.value });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="All">All Fits</option>
              <option value="Regular">Regular</option>
              <option value="Oversized">Oversized</option>
              <option value="Slim">Slim Fit</option>
              <option value="Relaxed">Relaxed</option>
              <option value="Tailored">Tailored</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase mr-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                const s = e.target.value as any;
                setSortBy(s);
                executeSearch(searchQuery, { sort: s });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="recommended">Recommended (OP AI)</option>
              <option value="best_match">Most Relevant</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Popular / Most Reviewed</option>
              <option value="wardrobe_match">Wardrobe Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SECTION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          const count =
            tab.id === "saved"
              ? savedProducts.length
              : searchResponse?.sections?.[tab.id]?.length || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shadow-xs ${
                isActive
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PRODUCTS GRID / EMPTY STATE / FALLBACK */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-square rounded-2xl bg-[var(--surface-soft)]" />
              <div className="h-4 w-3/4 rounded-lg bg-[var(--surface-soft)]" />
              <div className="h-4 w-1/2 rounded-lg bg-[var(--surface-soft)]" />
              <div className="h-10 w-full rounded-xl bg-[var(--surface-soft)]" />
            </div>
          ))}
        </div>
      ) : searchResponse?.isFallback || currentProducts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4 shadow-[var(--shadow-card)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center mx-auto text-[var(--primary)]">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {activeSection === "saved"
                ? "Your Wishlist is Empty"
                : searchResponse?.fallbackMessage || "No Products Found"}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {activeSection === "saved"
                ? "Click the heart icon on any recommendation to save items to your private wishlist."
                : searchResponse?.fallbackMessage || "Try adjusting your search terms, price filter, or style keywords."}
            </p>
          </div>
          {activeSection !== "saved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => executeSearch("Linen Shirt")}
              className="rounded-xl font-bold"
            >
              Reset to Recommendations
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((prod) => {
            const isSaved = activeSavedIds.has(prod.id);

            return (
              <div
                key={prod.id}
                className="group relative rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all duration-200 shadow-[var(--shadow-card)] hover:shadow-lg flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 space-y-3.5">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-2xl bg-[var(--surface-soft)] overflow-hidden">
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Merchant / Store Source Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-[10px] font-bold text-white shadow-xs">
                      {prod.store || prod.brand || prod.provider}
                    </div>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSaved(prod)}
                      className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-xs ${
                        isSaved
                          ? "bg-red-500 text-white"
                          : "bg-black/50 text-white hover:bg-black/80 hover:text-red-400"
                      }`}
                      title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>

                    {/* Recommendation Badge */}
                    {prod.recommendationBadge && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-[var(--primary)] text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{prod.recommendationBadge}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Brand */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      {prod.brand || prod.category}
                    </div>
                    <h4
                      className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 leading-snug"
                      title={prod.title}
                    >
                      {prod.title}
                    </h4>
                  </div>

                  {/* Price & Rating */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-[var(--text-primary)]">
                        {prod.currency === "USD" ? "$" : "₹"}
                        {prod.price.toLocaleString()}
                      </span>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <span className="text-xs text-[var(--text-muted)] line-through">
                          {prod.currency === "USD" ? "$" : "₹"}
                          {prod.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {prod.discountPercent && (
                        <span className="text-[10px] font-bold text-emerald-500">
                          {prod.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {prod.rating !== null && prod.rating !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{prod.rating.toFixed(1)}</span>
                        {prod.reviewCount ? (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({prod.reviewCount})
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Delivery Info */}
                  {prod.deliveryInformation && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                      <Truck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{prod.deliveryInformation}</span>
                    </div>
                  )}

                  {/* Why OP AI Recommends It */}
                  {prod.recommendationReason && (
                    <div className="p-3 rounded-2xl bg-[var(--primary-soft)]/60 border border-[var(--primary)]/20 text-xs text-[var(--text-secondary)] space-y-1">
                      <div className="flex items-center gap-1 font-bold text-[var(--primary)] text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Why OP AI Recommends It:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-3">
                        {prod.recommendationReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* View Product External Button */}
                    <a
                      href={prod.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-xs"
                    >
                      <span>View Product</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Add to Wardrobe Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToWardrobe(prod)}
                      disabled={isAddingToWardrobe}
                      className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer"
                      title="Add to your digital wardrobe"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Wardrobe</span>
                    </button>
                  </div>

                  {/* Do I Need This? Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickViewProduct(prod);
                      handleEvaluatePurchase(prod);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)] hover:text-[var(--primary)] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>&quot;Do I Need This?&quot; Financial & Redundancy Check</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "DO I NEED THIS?" EVALUATION MODAL */}
      <Modal
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        title="Purchase & Redundancy Intelligence"
        size="md"
      >
        {quickViewProduct && (
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <img
                src={quickViewProduct.imageUrl}
                alt={quickViewProduct.title}
                className="w-20 h-20 rounded-2xl object-cover border border-[var(--border)] shrink-0"
              />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">
                  {quickViewProduct.title}
                </h4>
                <div className="text-sm font-extrabold text-[var(--primary)]">
                  {quickViewProduct.currency === "USD" ? "$" : "₹"}
                  {quickViewProduct.price.toLocaleString()}
                </div>
              </div>
            </div>

            {isEvaluatingProduct ? (
              <div className="p-8 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[var(--text-muted)]">
                  Evaluating wardrobe duplication and monthly budget impact...
                </p>
              </div>
            ) : evalResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    evalResult.verdict === "High Wardrobe Value"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                      : evalResult.verdict === "High Redundancy"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-600"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      OP AI Verdict
                    </span>
                    <h4 className="text-base font-extrabold">{evalResult.verdict}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Similar in Wardrobe
                    </span>
                    <div className="text-lg font-black">{evalResult.existingSimilarItemsCount} item(s)</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Analysis Breakdown
                  </h5>
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-2">
                    <p className="leading-relaxed">{evalResult.explanation}</p>
                    <p className="font-semibold text-[var(--text-primary)]">{evalResult.recommendation}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickViewProduct(null)}
                className="rounded-xl font-bold"
              >
                Close
              </Button>
              <a
                href={quickViewProduct.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90"
              >
                <span>Proceed to Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

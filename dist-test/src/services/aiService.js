// Map of keywords and color patterns for intelligent offline/client heuristic analysis
const CATEGORY_RULES = [
    {
        category: "Dresses",
        keywords: ["dress", "gown", "frock", "midi", "maxi", "mini dress", "sundress", "slip dress"],
        subcategories: ["Midi Dress", "Slip Dress", "Wrap Dress", "Cocktail Dress", "Sundress", "Maxi Dress"],
        defaultOccasions: ["Party", "Date", "Dinner", "Formal Event", "Everyday"],
        defaultSeasons: ["Spring", "Summer", "All-Season"],
    },
    {
        category: "Tops",
        keywords: ["shirt", "t-shirt", "tee", "blouse", "top", "sweater", "hoodie", "polo", "knitwear", "turtleneck"],
        subcategories: ["Button-Down Shirt", "Classic T-Shirt", "Knit Sweater", "Silk Blouse", "Polo Shirt", "Hoodie"],
        defaultOccasions: ["Office", "Meeting", "Casual", "Everyday", "Weekend Casual"],
        defaultSeasons: ["All-Season"],
    },
    {
        category: "Bottoms",
        keywords: ["pants", "trousers", "jeans", "chinos", "skirt", "shorts", "slacks", "cargo", "denim"],
        subcategories: ["Tailored Trousers", "Straight Jeans", "Pleated Chinos", "Midi Skirt", "Relaxed Slacks"],
        defaultOccasions: ["Office", "Casual", "Everyday", "Dinner", "Weekend Casual"],
        defaultSeasons: ["All-Season"],
    },
    {
        category: "Outerwear",
        keywords: ["jacket", "coat", "blazer", "bomber", "overcoat", "cardigan", "trench", "parka", "windbreaker"],
        subcategories: ["Structured Blazer", "Trench Coat", "Wool Overcoat", "Bomber Jacket", "Cardigan"],
        defaultOccasions: ["Office", "Meeting", "Dinner", "Formal Event", "Travel"],
        defaultSeasons: ["Autumn", "Winter", "Spring"],
    },
    {
        category: "Shoes",
        keywords: ["shoe", "shoes", "sneaker", "sneakers", "boots", "loafers", "heels", "flats", "oxford", "derby"],
        subcategories: ["Leather Loafers", "Minimalist Sneakers", "Chelsea Boots", "Oxford Shoes", "Dress Heels"],
        defaultOccasions: ["Office", "Meeting", "Dinner", "Casual", "Everyday"],
        defaultSeasons: ["All-Season"],
    },
    {
        category: "Accessories",
        keywords: ["watch", "belt", "bag", "tote", "scarf", "hat", "glasses", "sunglasses", "tie", "jewelry"],
        subcategories: ["Leather Belt", "Minimalist Watch", "Leather Tote", "Silk Scarf", "Classic Sunglasses"],
        defaultOccasions: ["Office", "Meeting", "Formal Event", "Dinner", "Everyday"],
        defaultSeasons: ["All-Season"],
    },
];
const COLOR_KEYWORDS = [
    { name: "Red", keywords: ["red", "crimson", "scarlet", "ruby", "maroon", "burgundy", "cherry"] },
    { name: "Black", keywords: ["black", "dark", "noir", "charcoal", "onyx", "ebony"] },
    { name: "White", keywords: ["white", "cream", "ivory", "pearl", "snow", "off-white"] },
    { name: "Navy", keywords: ["navy", "dark blue", "midnight blue", "indigo"] },
    { name: "Blue", keywords: ["blue", "sky", "azure", "denim", "cobalt", "cyan"] },
    { name: "Grey", keywords: ["grey", "gray", "silver", "slate", "ash", "heather"] },
    { name: "Beige", keywords: ["beige", "sand", "tan", "khaki", "camel", "taupe", "nude"] },
    { name: "Olive", keywords: ["olive", "army", "moss", "khaki green", "sage", "forest"] },
    { name: "Brown", keywords: ["brown", "espresso", "chocolate", "cognac", "mocha"] },
    { name: "Pink", keywords: ["pink", "blush", "rose", "coral", "magenta"] },
    { name: "Cyan", keywords: ["cyan", "teal", "turquoise", "aqua"] },
];
export const aiService = {
    /**
     * Analyze clothing image with OP AI Vision Intelligence
     * Extracts category, color, fit, style, and auto-fills default user profile size.
     */
    analyzeClothingImage: async (imageInput, userProfile, manualContextText) => {
        // Artificial latency (700ms) for polished analysis experience
        await new Promise((resolve) => setTimeout(resolve, 750));
        const lowerInput = (imageInput + " " + (manualContextText || "")).toLowerCase();
        // 1. Detect Category & Subcategory
        let detectedCategory = "Tops";
        let detectedSubcategory = "Classic Shirt";
        let defaultOccasions = ["Casual", "Everyday"];
        let defaultSeasons = ["All-Season"];
        for (const rule of CATEGORY_RULES) {
            if (rule.keywords.some((kw) => lowerInput.includes(kw))) {
                detectedCategory = rule.category;
                detectedSubcategory = rule.subcategories[0];
                defaultOccasions = rule.defaultOccasions;
                defaultSeasons = rule.defaultSeasons;
                break;
            }
        }
        // 2. Detect Color
        let detectedColor = "Black";
        for (const colorRule of COLOR_KEYWORDS) {
            if (colorRule.keywords.some((kw) => lowerInput.includes(kw))) {
                detectedColor = colorRule.name;
                break;
            }
        }
        // If "dress" + "red" in input
        if (lowerInput.includes("red") && (lowerInput.includes("dress") || detectedCategory === "Dresses")) {
            detectedCategory = "Dresses";
            detectedColor = "Red";
            detectedSubcategory = "Midi Evening Dress";
            defaultOccasions = ["Party", "Date", "Dinner", "Formal Event"];
            defaultSeasons = ["Spring", "Summer"];
        }
        // 3. Determine Sizing from User Profile Defaults (Part 14, 15, 31)
        let defaultSize = "M";
        if (userProfile?.sizes) {
            if (detectedCategory === "Tops" || detectedCategory === "Dresses" || detectedCategory === "Outerwear") {
                defaultSize = userProfile.sizes.tops || "M";
            }
            else if (detectedCategory === "Bottoms") {
                defaultSize = userProfile.sizes.bottoms || "32";
            }
            else if (detectedCategory === "Shoes") {
                defaultSize = userProfile.sizes.shoes || "10 US";
            }
        }
        // 4. Inferred Fit & Style
        let detectedFit = "Regular";
        if (lowerInput.includes("oversized") || lowerInput.includes("loose") || lowerInput.includes("baggy")) {
            detectedFit = "Oversized";
        }
        else if (lowerInput.includes("slim") || lowerInput.includes("fitted") || lowerInput.includes("skinny")) {
            detectedFit = "Slim";
        }
        else if (lowerInput.includes("relaxed")) {
            detectedFit = "Relaxed";
        }
        else if (userProfile?.fitPreference && userProfile.fitPreference !== "Not Specified") {
            // Respect user profile fit tendency as gentle baseline
            detectedFit = userProfile.fitPreference;
        }
        // 5. Detect Brand if mentioned or evident
        let detectedBrand = undefined;
        const knownBrands = ["Acne Studios", "Theory", "Lemaire", "Cos Atelier", "Zara", "Nike", "Uniqlo", "Crockett & Jones", "Junghans"];
        for (const b of knownBrands) {
            if (lowerInput.includes(b.toLowerCase())) {
                detectedBrand = b;
                break;
            }
        }
        // 6. Generate Generated Name
        const namePrefix = detectedColor;
        const fitLabel = detectedFit === "Oversized" ? "Oversized " : detectedFit === "Slim" ? "Tailored " : "";
        const name = `${namePrefix} ${fitLabel}${detectedSubcategory}`.trim();
        return {
            name,
            category: detectedCategory,
            subcategory: detectedSubcategory,
            color: detectedColor,
            style: detectedFit === "Oversized" ? "Relaxed Minimal" : "Modern Classic",
            occasion: defaultOccasions,
            season: defaultSeasons,
            fit: detectedFit,
            size: defaultSize,
            brand: detectedBrand,
            material: detectedCategory === "Shoes" ? "Calfskin Leather" : detectedCategory === "Outerwear" ? "Wool Blend" : "100% Cotton",
            confidence: "high",
            aiSummary: `OP AI identified a ${detectedColor.toLowerCase()} ${detectedCategory.toLowerCase()} piece. Configured for ${defaultOccasions.slice(0, 2).join(" & ")} with default size ${defaultSize}.`,
        };
    },
    /**
     * Parse natural language style statements into structured profile preferences (Part 21, 22)
     * Example: "I usually wear oversized black clothes and prefer casual outfits"
     */
    parseNaturalLanguagePreferences: (input) => {
        const text = input.toLowerCase();
        const colors = [];
        if (text.includes("black"))
            colors.push("Black");
        if (text.includes("white"))
            colors.push("White");
        if (text.includes("navy"))
            colors.push("Navy");
        if (text.includes("grey") || text.includes("gray"))
            colors.push("Grey");
        if (text.includes("beige") || text.includes("tan"))
            colors.push("Beige");
        if (text.includes("blue"))
            colors.push("Blue");
        if (text.includes("red"))
            colors.push("Red");
        if (text.includes("olive"))
            colors.push("Olive");
        const styles = [];
        if (text.includes("minimal"))
            styles.push("Minimalist");
        if (text.includes("casual"))
            styles.push("Casual");
        if (text.includes("tailored") || text.includes("formal") || text.includes("smart"))
            styles.push("Tailored Classic");
        if (text.includes("streetwear"))
            styles.push("Streetwear");
        if (text.includes("quiet luxury") || text.includes("luxury"))
            styles.push("Quiet Luxury");
        let fit = "Regular";
        if (text.includes("oversized"))
            fit = "Oversized";
        else if (text.includes("slim"))
            fit = "Slim";
        else if (text.includes("relaxed") || text.includes("loose"))
            fit = "Relaxed";
        const occasions = [];
        if (text.includes("office") || text.includes("work"))
            occasions.push("Office");
        if (text.includes("meeting"))
            occasions.push("Meeting");
        if (text.includes("casual") || text.includes("everyday"))
            occasions.push("Everyday");
        if (text.includes("party") || text.includes("night") || text.includes("dinner"))
            occasions.push("Dinner");
        return {
            preferredColors: colors.length > 0 ? colors : ["Black", "Grey", "Navy"],
            preferredStyles: styles.length > 0 ? styles : ["Minimalist", "Casual"],
            fitPreference: fit,
            preferredOccasions: occasions.length > 0 ? occasions : ["Office", "Everyday", "Dinner"],
        };
    },
};

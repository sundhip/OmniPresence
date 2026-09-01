import { FinancialPlan, PurchaseEvaluation, TransactionCategory } from "@/types/finance";
import { WardrobeItem } from "@/types/wardrobe";

export class FinancialEngine {
  /**
   * Evaluates purchase necessity ("Do I Need This?") across any category (Fashion, Gaming, Food, Stationery, etc.)
   */
  public static evaluatePurchaseNecessity(
    itemQuery: string,
    price: number,
    category: string,
    color?: string,
    wardrobe: WardrobeItem[] = [],
    plan?: FinancialPlan | null
  ): PurchaseEvaluation {
    const cleanQuery = itemQuery.toLowerCase();
    const cleanCat = category.toLowerCase();
    const cleanColor = (color || "").toLowerCase();

    const monthlyBudget = plan?.monthlyBudget || plan?.monthlyFashionBudget || 15000;
    const spentBefore = plan?.spentThisMonth || 0;
    const remainingBefore = Math.max(0, monthlyBudget - spentBefore);
    const remainingAfter = remainingBefore - price;
    const isOverBudget = remainingAfter < 0;
    const overBudgetBy = isOverBudget ? Math.abs(remainingAfter) : 0;

    const isClothingCategory =
      cleanCat.includes("top") ||
      cleanCat.includes("bottom") ||
      cleanCat.includes("dress") ||
      cleanCat.includes("shoe") ||
      cleanCat.includes("outerwear") ||
      cleanCat.includes("clothing") ||
      cleanCat.includes("fashion") ||
      cleanCat.includes("accessories");

    let existingCount = 0;
    let similarNames: string[] = [];
    let avgWear = 0;
    let colorSat: PurchaseEvaluation["colorSaturation"] = "Balanced";
    let catSat: PurchaseEvaluation["categorySaturation"] = "Balanced";
    let verdict: PurchaseEvaluation["verdict"] = "Moderate Value";
    let explanation = "";
    let recommendation = "";
    let altSuggestion: PurchaseEvaluation["alternativeSuggestion"];

    if (isClothingCategory) {
      // 1. Fashion / Wardrobe specific evaluation
      const similarItems = wardrobe.filter((w) => {
        const wName = w.name.toLowerCase();
        const wCat = (w.category || "").toLowerCase();
        const wColor = (w.color || "").toLowerCase();
        const wSub = (w.subcategory || "").toLowerCase();

        const sameCat = wCat === cleanCat || wSub.includes(cleanCat) || cleanCat.includes(wCat);
        const sameColor = cleanColor ? wColor.includes(cleanColor) || cleanColor.includes(wColor) : false;

        return sameCat && (sameColor || wName.includes(cleanQuery) || cleanQuery.includes(wName));
      });

      existingCount = similarItems.length;
      similarNames = similarItems.map((i) => i.name);
      avgWear =
        similarItems.length > 0
          ? Math.round(
              similarItems.reduce((acc, i) => acc + (i.wearCount || 0), 0) / similarItems.length
            )
          : 0;

      if (existingCount >= 3) {
        colorSat = "High Redundancy";
      } else if (existingCount === 0) {
        colorSat = "Low";
      }

      const sameCatTotal = wardrobe.filter(
        (w) => (w.category || "").toLowerCase() === cleanCat
      ).length;

      if (sameCatTotal >= 6) {
        catSat = "Saturated";
      } else if (sameCatTotal <= 1) {
        catSat = "Under-represented";
      }

      if (existingCount >= 3) {
        verdict = "High Redundancy";
        explanation = `You already own ${existingCount} similar ${color ? `${color.toLowerCase()} ` : ""}${category.toLowerCase()} items in your wardrobe (e.g. ${similarNames.slice(0, 2).join(", ")}). This purchase may add limited novelty.`;
        if (isOverBudget) {
          explanation += ` Additionally, this exceeds your remaining monthly budget by ₹${overBudgetBy.toLocaleString()}.`;
        }
        recommendation = "You have strong coverage in this category. A complementary shade or different silhouette would offer better versatility.";

        const altColor =
          color?.toLowerCase() === "black" ? "Light Blue" : color?.toLowerCase() === "white" ? "Olive" : "Navy";
        altSuggestion = {
          category,
          color: altColor,
          reason: `Adding a ${altColor} ${category.toLowerCase()} fills a versatile styling gap without duplicating your existing ${color || "current"} pieces.`,
        };
      } else if (isOverBudget) {
        verdict = "Budget Alert";
        explanation = `This purchase is ₹${overBudgetBy.toLocaleString()} above your remaining monthly budget (₹${remainingBefore.toLocaleString()}).`;
        recommendation = `Consider deferring to next month or exploring cost-effective alternatives under ₹${remainingBefore.toLocaleString()}.`;
      } else if (existingCount === 0 && catSat === "Under-represented") {
        verdict = "High Wardrobe Value";
        explanation = `You currently have limited pieces in ${category}. Adding this item expands your outfit combinations significantly.`;
        recommendation = "High versatility addition with strong utility potential across multiple occasions.";
      } else {
        verdict = "Moderate Value";
        explanation = `You own ${existingCount} item(s) in this style. This purchase aligns with your wardrobe profile and fits comfortably within your monthly budget.`;
        recommendation = "A balanced addition if it fulfills an upcoming event or everyday need.";
      }
    } else {
      // 2. General Expense Evaluation (Gaming, Food, Stationery, Tech, Bills, etc.)
      const recentSameCatTx = (plan?.transactions || []).filter(
        (t) => (t.category || "").toLowerCase().includes(cleanCat) || cleanCat.includes((t.category || "").toLowerCase())
      );
      existingCount = recentSameCatTx.length;
      similarNames = recentSameCatTx.map((t) => `${t.title} (₹${t.amount})`);

      const totalCatSpent = recentSameCatTx.reduce((sum, t) => sum + (t.amount || 0), 0);

      if (isOverBudget) {
        verdict = "Budget Alert";
        explanation = `This ₹${price.toLocaleString()} ${category} purchase exceeds your remaining monthly budget by ₹${overBudgetBy.toLocaleString()}.`;
        recommendation = "Hold off or prioritize essential obligations before discretionary expenditures.";
      } else if (existingCount >= 4 && (cleanCat.includes("game") || cleanCat.includes("food") || cleanCat.includes("entertainment"))) {
        verdict = "High Redundancy";
        explanation = `You have logged ${existingCount} expenses in ${category} this month (totaling ₹${totalCatSpent.toLocaleString()}). Frequent discretionary purchases in this category are accelerating your spending rate.`;
        recommendation = "Consider a cooling-off period before completing this purchase to maintain your savings goal.";
        altSuggestion = {
          category,
          reason: `Evaluate free or existing alternatives you already possess before adding another ${category} item.`,
        };
      } else if (cleanCat.includes("stationery") || cleanCat.includes("book") || cleanCat.includes("health")) {
        verdict = "High Wardrobe Value";
        explanation = `This ₹${price.toLocaleString()} ${category} expense is an investment in productivity, education, or wellness and fits comfortably within your remaining ₹${remainingBefore.toLocaleString()} budget.`;
        recommendation = "Productive and high-utility expense that aligns with personal growth goals.";
      } else {
        verdict = "Moderate Value";
        explanation = `This ₹${price.toLocaleString()} ${category} expense is within your remaining monthly allowance of ₹${remainingBefore.toLocaleString()}.`;
        recommendation = "Fits comfortably within your monthly financial plan.";
      }
    }

    return {
      itemQuery,
      price,
      category,
      color,
      existingSimilarItemsCount: existingCount,
      similarItemNames: similarNames,
      colorSaturation: colorSat,
      categorySaturation: catSat,
      averageWearOfSimilar: avgWear,
      budgetImpact: {
        monthlyBudget,
        spentBefore,
        remainingBefore,
        spentAfter: spentBefore + price,
        remainingAfter: Math.max(0, remainingAfter),
        isOverBudget,
        overBudgetBy,
      },
      verdict,
      explanation,
      recommendation,
      alternativeSuggestion: altSuggestion,
    };
  }
}

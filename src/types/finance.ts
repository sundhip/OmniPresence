export type TransactionCategory =
  | "Food & Dining"
  | "Gaming & Tech"
  | "Stationery & Books"
  | "Clothing & Fashion"
  | "Entertainment"
  | "Travel & Transit"
  | "Health & Fitness"
  | "Bills & Utilities"
  | "Groceries"
  | "Footwear"
  | "Accessories"
  | "Alterations"
  | "Care"
  | "Other";

export interface FinancialTransaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  provider?: string;
  notes?: string;
}

export interface FinancialPlan {
  userId: string;
  monthlyBudget?: number; // e.g. 15000 (Total monthly expenditure allowance)
  monthlyFashionBudget: number; // e.g. 5000 (Fashion/clothing sub-budget)
  clothingBudget?: number;
  shoppingLimit?: number;
  savingsGoal: number; // e.g. 3000
  spentThisMonth: number; // dynamically computed from transactions
  currency: string; // "₹"
  categoryLimits?: Partial<Record<TransactionCategory, number>>;
  transactions: FinancialTransaction[];
  updatedAt: string;
}

export interface PurchaseEvaluation {
  itemQuery: string;
  price: number;
  category: string;
  color?: string;
  existingSimilarItemsCount: number;
  similarItemNames: string[];
  colorSaturation: "Low" | "Balanced" | "High Redundancy";
  categorySaturation: "Under-represented" | "Balanced" | "Saturated" | "High Duplication";
  averageWearOfSimilar: number;
  budgetImpact: {
    monthlyBudget: number;
    spentBefore: number;
    remainingBefore: number;
    spentAfter: number;
    remainingAfter: number;
    isOverBudget: boolean;
    overBudgetBy: number;
  };
  verdict: "High Wardrobe Value" | "Moderate Value" | "High Redundancy" | "Budget Alert";
  explanation: string;
  recommendation: string;
  alternativeSuggestion?: {
    category: string;
    color?: string;
    reason: string;
  };
}

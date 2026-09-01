import { FinancialPlan, FinancialTransaction, PurchaseEvaluation } from "@/types/finance";
import { AppStorage } from "@/lib/storage";
import { FinancialEngine } from "@/lib/financialEngine";
import { wardrobeService } from "./wardrobeService";

export const financeService = {
  getFinancialPlan: async (): Promise<FinancialPlan> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    return AppStorage.getFinancialPlan(userId);
  },

  saveFinancialPlan: async (plan: FinancialPlan): Promise<FinancialPlan> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    AppStorage.saveFinancialPlan(userId, plan);
    return plan;
  },

  addTransaction: async (
    data: Omit<FinancialTransaction, "id">
  ): Promise<FinancialPlan> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    const plan = AppStorage.getFinancialPlan(userId);

    const newTx: FinancialTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...data,
    };

    const updatedTransactions = [newTx, ...(plan.transactions || [])];
    const newSpent = updatedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const updatedPlan: FinancialPlan = {
      ...plan,
      spentThisMonth: newSpent,
      transactions: updatedTransactions,
      updatedAt: new Date().toISOString(),
    };

    AppStorage.saveFinancialPlan(userId, updatedPlan);
    return updatedPlan;
  },

  deleteTransaction: async (txId: string): Promise<FinancialPlan> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    const plan = AppStorage.getFinancialPlan(userId);

    const updatedTransactions = (plan.transactions || []).filter((t) => t.id !== txId);
    const newSpent = updatedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const updatedPlan: FinancialPlan = {
      ...plan,
      spentThisMonth: newSpent,
      transactions: updatedTransactions,
      updatedAt: new Date().toISOString(),
    };

    AppStorage.saveFinancialPlan(userId, updatedPlan);
    return updatedPlan;
  },

  evaluatePurchase: async (
    itemQuery: string,
    price: number,
    category: string,
    color?: string
  ): Promise<PurchaseEvaluation> => {
    const userId = AppStorage.getActiveUserId() || "user_alex_mercer";
    const wardrobe = await wardrobeService.getItems();
    const plan = AppStorage.getFinancialPlan(userId);

    return FinancialEngine.evaluatePurchaseNecessity(
      itemQuery,
      price,
      category,
      color,
      wardrobe,
      plan
    );
  },
};

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { financeService } from "@/services/financeService";
import { wardrobeService } from "@/services/wardrobeService";
import { FinancialPlan, PurchaseEvaluation, TransactionCategory } from "@/types/finance";
import { WardrobeItem } from "@/types/wardrobe";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  Wallet,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Plus,
  DollarSign,
  Shirt,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  Zap,
  Gamepad2,
  Utensils,
  BookOpen,
  Film,
  Train,
  Activity,
  Receipt,
  Trash2,
  Info,
} from "lucide-react";

const CATEGORY_OPTIONS: { label: string; value: TransactionCategory; icon: string }[] = [
  { label: "🍔 Food & Dining", value: "Food & Dining", icon: "Utensils" },
  { label: "🎮 Gaming & Tech", value: "Gaming & Tech", icon: "Gamepad2" },
  { label: "📚 Stationery & Books", value: "Stationery & Books", icon: "BookOpen" },
  { label: "👗 Clothing & Fashion", value: "Clothing & Fashion", icon: "Shirt" },
  { label: "🎬 Entertainment", value: "Entertainment", icon: "Film" },
  { label: "🚆 Travel & Transit", value: "Travel & Transit", icon: "Train" },
  { label: "🏋️ Health & Fitness", value: "Health & Fitness", icon: "Activity" },
  { label: "💡 Bills & Utilities", value: "Bills & Utilities", icon: "Receipt" },
  { label: "📦 Other / General", value: "Other", icon: "ShoppingBag" },
];

export default function FinancePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [plan, setPlan] = useState<FinancialPlan | null>(null);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category filter for transaction history
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");

  // "Do I Need This?" Evaluator Form State
  const [evalItem, setEvalItem] = useState("Steam Game / Mechanical Keyboard");
  const [evalPrice, setEvalPrice] = useState<number | string>(2500);
  const [evalCategory, setEvalCategory] = useState<string>("Gaming & Tech");
  const [evalColor, setEvalColor] = useState("");
  const [evaluation, setEvaluation] = useState<PurchaseEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Edit Budget Goals Modal
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [budgetMonthly, setBudgetMonthly] = useState<number | string>(0);
  const [budgetSavings, setBudgetSavings] = useState<number | string>(0);

  // Add Transaction Modal
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState<number | string>("");
  const [txCategory, setTxCategory] = useState<TransactionCategory>("Food & Dining");
  const [txNotes, setTxNotes] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fPlan, wList] = await Promise.all([
        financeService.getFinancialPlan(),
        wardrobeService.getItems(),
      ]);
      setPlan(fPlan);
      setWardrobe(wList);
      setBudgetMonthly(fPlan.monthlyBudget || 0);
      setBudgetSavings(fPlan.savingsGoal || 0);

      // Run initial default evaluation
      const initialEval = await financeService.evaluatePurchase(
        "Mechanical Keyboard",
        2500,
        "Gaming & Tech"
      );
      setEvaluation(initialEval);
    } catch (err: any) {
      toastError("Load Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRunEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(evalPrice);
    if (!evalItem.trim() || !priceNum || priceNum <= 0) {
      toastError("Invalid Input", "Please provide a valid item name and price.");
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await financeService.evaluatePurchase(
        evalItem.trim(),
        priceNum,
        evalCategory,
        evalColor.trim() || undefined
      );
      setEvaluation(res);
      success("Evaluation Complete", `OP AI evaluated "${evalItem}".`);
    } catch (err: any) {
      toastError("Evaluation Failed", err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    const monthlyNum = Number(budgetMonthly) || 0;
    const savingsNum = Number(budgetSavings) || 0;

    const updated: FinancialPlan = {
      ...plan,
      monthlyBudget: monthlyNum,
      monthlyFashionBudget: Math.round(monthlyNum * 0.35),
      savingsGoal: savingsNum,
      shoppingLimit: monthlyNum,
    };

    await financeService.saveFinancialPlan(updated);
    setPlan(updated);
    setIsEditBudgetOpen(false);
    success("Budget Updated", "Monthly financial plan saved.");
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (!txTitle.trim() || !amountNum || amountNum <= 0) {
      toastError("Invalid Amount", "Please provide a valid amount and description.");
      return;
    }

    const updated = await financeService.addTransaction({
      title: txTitle.trim(),
      amount: amountNum,
      date: new Date().toISOString().split("T")[0],
      category: txCategory,
      notes: txNotes.trim() || undefined,
    });

    setPlan(updated);
    setIsAddTxOpen(false);
    setTxTitle("");
    setTxAmount("");
    setTxNotes("");
    success("Expense Logged", `₹${amountNum.toLocaleString()} logged under ${txCategory}.`);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = await financeService.deleteTransaction(id);
    setPlan(updated);
    success("Expense Removed", "Transaction deleted from spending history.");
  };

  const spent = plan?.spentThisMonth || 0;
  const budget = plan?.monthlyBudget || 0;
  const savings = plan?.savingsGoal || 0;
  const remaining = budget > 0 ? Math.max(0, budget - spent) : 0;
  const percentSpent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  // Compute category totals
  const categoryTotals = (plan?.transactions || []).reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const filteredTransactions = (plan?.transactions || []).filter((tx) => {
    if (activeCategoryFilter === "All") return true;
    return tx.category === activeCategoryFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Financial Budget & Spending Intelligence
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
              Personal Goals
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Track daily expenses across Food, Gaming, Stationery, Fashion, Travel, and evaluate &quot;Do I Need This?&quot;
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBudgetMonthly(plan?.monthlyBudget || 0);
              setBudgetSavings(plan?.savingsGoal || 0);
              setIsEditBudgetOpen(true);
            }}
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            Adjust Budget
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTxAmount("");
              setTxTitle("");
              setTxNotes("");
              setIsAddTxOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Expense
          </Button>
        </div>
      </div>

      {/* Zero Budget Prompt Banner */}
      {budget === 0 && (
        <div className="p-4 rounded-3xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
            <Info className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
            <span>
              All budget values are set to <strong>₹0</strong> by default. Click <strong>Adjust Budget</strong> to set your monthly spending allowance and savings target.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEditBudgetOpen(true)}
            className="flex-shrink-0 text-xs py-1.5 px-3"
          >
            Set Budget
          </Button>
        </div>
      )}

      {/* 1. FINANCIAL DASHBOARD METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Monthly Budget
          </span>
          <p className="text-2xl font-black text-[var(--text-primary)]">
            ₹{budget.toLocaleString()}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">
            {budget === 0 ? "Not configured yet" : "Total monthly allowance"}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Spent This Month
          </span>
          <p className="text-2xl font-black text-amber-500">
            ₹{spent.toLocaleString()}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">
            {spent === 0 ? "No expenses logged yet" : `${percentSpent}% of budget used`}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Remaining Budget
          </span>
          <p className="text-2xl font-black text-emerald-500">
            ₹{remaining.toLocaleString()}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">
            {budget === 0 ? "Set budget to track" : "Available allowance"}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Savings Target
          </span>
          <p className="text-2xl font-black text-[var(--primary)]">
            ₹{savings.toLocaleString()}
          </p>
          <span className="text-[11px] text-[var(--text-muted)]">Target monthly savings</span>
        </div>
      </div>

      {/* Budget Progress Meter */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-[var(--text-primary)]">Monthly Budget Utilization</span>
          <span className="text-[var(--text-secondary)]">
            {budget === 0 ? "0% (Budget not set)" : `${percentSpent}% Used`}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-[var(--surface-soft)] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentSpent >= 90
                ? "bg-rose-500"
                : percentSpent >= 70
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${percentSpent}%` }}
          />
        </div>
      </div>

      {/* Category Spending Breakdown Badges */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Expenditure Breakdown by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Food & Dining", key: "Food & Dining", emoji: "🍔" },
            { label: "Gaming & Tech", key: "Gaming & Tech", emoji: "🎮" },
            { label: "Stationery & Books", key: "Stationery & Books", emoji: "📚" },
            { label: "Clothing & Fashion", key: "Clothing & Fashion", emoji: "👗" },
            { label: "Entertainment", key: "Entertainment", emoji: "🎬" },
            { label: "Travel & Transit", key: "Travel & Transit", emoji: "🚆" },
            { label: "Health & Fitness", key: "Health & Fitness", emoji: "🏋️" },
            { label: "Bills & Utilities", key: "Bills & Utilities", emoji: "💡" },
          ].map((cat) => {
            const catSpent = categoryTotals[cat.key] || 0;
            return (
              <div
                key={cat.key}
                className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] space-y-1"
              >
                <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                  <span>{cat.emoji}</span> {cat.label}
                </span>
                <p className="text-base font-bold text-[var(--text-primary)]">
                  ₹{catSpent.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. "DO I NEED THIS?" PURCHASE EVALUATOR (Supports Any Category) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                &quot;Do I Need This?&quot; — Smart Purchase Evaluator
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Evaluate any prospective purchase (Food, Gaming, Stationery, Tech, Fashion) against your budget and existing inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Evaluator Form */}
        <form onSubmit={handleRunEvaluation} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Prospective Item *"
            value={evalItem}
            onChange={(e) => setEvalItem(e.target.value)}
            placeholder="e.g. Mechanical Keyboard, Gaming headset, Zara Jacket"
            required
          />

          <Input
            label="Price (₹) *"
            type="number"
            value={evalPrice}
            onChange={(e) => setEvalPrice(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Category
            </label>
            <select
              value={evalCategory}
              onChange={(e) => setEvalCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Color / Note (Optional)
            </label>
            <input
              type="text"
              value={evalColor}
              onChange={(e) => setEvalColor(e.target.value)}
              placeholder="e.g. Black, Wireless, 1-Month"
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isEvaluating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Evaluate with OP AI
            </Button>
          </div>
        </form>

        {/* EVALUATION RESULT DISPLAY */}
        {evaluation && (
          <div className="p-6 rounded-3xl bg-[var(--surface-soft)] border border-[var(--border)] space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    evaluation.verdict === "High Redundancy"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : evaluation.verdict === "Budget Alert"
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  Verdict: {evaluation.verdict}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Evaluated for &quot;{evaluation.itemQuery}&quot; (₹{evaluation.price.toLocaleString()})
              </span>
            </div>

            {/* Explanation */}
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
              {evaluation.explanation}
            </p>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Category Spending History
                </span>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {evaluation.existingSimilarItemsCount} item(s) / logs
                </p>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {evaluation.similarItemNames.slice(0, 2).join(", ") || "No duplicate purchases logged"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Budget Utilization
                </span>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {percentSpent}% Used
                </p>
                <span className="text-[11px] text-[var(--text-muted)]">
                  ₹{spent.toLocaleString()} spent of ₹{budget.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  Remaining After Purchase
                </span>
                <p
                  className={`text-lg font-bold ${
                    evaluation.budgetImpact.isOverBudget ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  ₹{evaluation.budgetImpact.remainingAfter.toLocaleString()}
                </p>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {evaluation.budgetImpact.isOverBudget
                    ? `Exceeds budget by ₹${evaluation.budgetImpact.overBudgetBy}`
                    : "Within monthly budget"}
                </span>
              </div>
            </div>

            {/* Alternative Suggestion */}
            {evaluation.alternativeSuggestion && (
              <div className="p-4 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 text-xs space-y-1 text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5 font-bold text-[var(--primary)]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>OP AI Financial Advisor:</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {evaluation.alternativeSuggestion.reason}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RECENT EXPENSES LOG & TRANSACTIONS */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Logged Expenses ({filteredTransactions.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["All", "Food & Dining", "Gaming & Tech", "Stationery & Books", "Clothing & Fashion", "Travel & Transit"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === cat
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              No expenses recorded in this view. Click <strong>&quot;Log Expense&quot;</strong> to record your daily spending.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)] flex justify-between items-center text-xs group"
              >
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{tx.title}</p>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {tx.date} • {tx.category} {tx.notes ? `• ${tx.notes}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[var(--text-primary)]">
                    ₹{tx.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete Transaction"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADJUST BUDGET MODAL */}
      <Modal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        title="Adjust Monthly Budget & Goals"
        size="sm"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <Input
            label="Total Monthly Budget (₹) *"
            type="number"
            value={budgetMonthly}
            onChange={(e) => setBudgetMonthly(e.target.value)}
            placeholder="e.g. 15000"
            required
          />
          <Input
            label="Monthly Savings Target (₹) *"
            type="number"
            value={budgetSavings}
            onChange={(e) => setBudgetSavings(e.target.value)}
            placeholder="e.g. 3000"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsEditBudgetOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD TRANSACTION MODAL */}
      <Modal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title="Log New Expense"
        size="sm"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Input
            label="Description *"
            placeholder="e.g. Lunch with friends, Steam Game, Stationery notebook"
            value={txTitle}
            onChange={(e) => setTxTitle(e.target.value)}
            required
          />
          <Input
            label="Amount (₹) *"
            type="number"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            placeholder="e.g. 350"
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Expense Category *
            </label>
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value as TransactionCategory)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Personal project, Weekend treat"
            value={txNotes}
            onChange={(e) => setTxNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsAddTxOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

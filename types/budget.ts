/**
 * Types for Phase 07 — Budget Management.
 */

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "decoration", label: "Decoration" },
  { value: "dj_music", label: "DJ / Music" },
  { value: "makeup", label: "Makeup" },
  { value: "attire", label: "Attire" },
  { value: "invitations", label: "Invitations" },
  { value: "transport", label: "Transport" },
  { value: "security", label: "Security" },
  { value: "gifts_favors", label: "Gifts & Favors" },
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "other", label: "Other" },
] as const;

export type ExpenseSource = "manual" | "ai";

export interface EventBudgetRecord {
  id: string;
  event_id: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetExpenseRecord {
  id: string;
  event_id: string;
  category: string;
  title: string;
  planned_amount: number;
  actual_amount: number;
  is_paid: boolean;
  vendor_id: string | null;
  notes: string | null;
  source: ExpenseSource;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetTotals {
  totalBudget: number;
  planned: number;
  actual: number;
  remaining: number;
  paidCount: number;
  unpaidCount: number;
}

export function getBudgetTotals(
  totalBudget: number,
  expenses: BudgetExpenseRecord[]
): BudgetTotals {
  const planned = expenses.reduce((sum, e) => sum + (e.planned_amount || 0), 0);
  const actual = expenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
  return {
    totalBudget,
    planned,
    actual,
    remaining: totalBudget - actual,
    paidCount: expenses.filter((e) => e.is_paid).length,
    unpaidCount: expenses.filter((e) => !e.is_paid).length,
  };
}

export interface BudgetCategoryBreakdown {
  category: string;
  planned: number;
  actual: number;
}

export function getBudgetCategoryBreakdown(expenses: BudgetExpenseRecord[]): BudgetCategoryBreakdown[] {
  const byCategory = new Map<string, BudgetCategoryBreakdown>();
  for (const e of expenses) {
    const existing = byCategory.get(e.category);
    if (existing) {
      existing.planned += e.planned_amount || 0;
      existing.actual += e.actual_amount || 0;
    } else {
      byCategory.set(e.category, { category: e.category, planned: e.planned_amount || 0, actual: e.actual_amount || 0 });
    }
  }
  return Array.from(byCategory.values()).sort((a, b) => b.planned - a.planned);
}

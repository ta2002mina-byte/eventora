import { PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBudgetCategoryBreakdown } from "@/types/budget";
import { EXPENSE_CATEGORY_OPTIONS } from "@/types/budget";
import type { BudgetExpenseRecord } from "@/types/budget";

function categoryLabel(value: string) {
  return EXPENSE_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export function BudgetCategoryChart({ expenses, currency }: { expenses: BudgetExpenseRecord[]; currency: string }) {
  const breakdown = getBudgetCategoryBreakdown(expenses);
  const maxPlanned = Math.max(1, ...breakdown.map((b) => b.planned));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-4 w-4 text-purple-700" /> By category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {breakdown.length === 0 ? (
          <EmptyState title="No expenses yet" description="Add an expense to see the category breakdown." />
        ) : (
          breakdown.map((row) => (
            <div key={row.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal">{categoryLabel(row.category)}</span>
                <span className="text-charcoal-400">
                  {row.actual.toLocaleString()} / {row.planned.toLocaleString()} {currency}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-lavender-100">
                <div
                  className="h-full rounded-pill bg-purple-600"
                  style={{ width: `${Math.min(100, (row.planned / maxPlanned) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

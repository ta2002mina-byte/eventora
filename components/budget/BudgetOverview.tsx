import { Wallet, PiggyBank, ReceiptText, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BudgetTotals } from "@/types/budget";

export function BudgetOverview({ totals, currency }: { totals: BudgetTotals; currency: string }) {
  const spentPercent = totals.totalBudget > 0 ? (totals.actual / totals.totalBudget) * 100 : 0;
  const isOverBudget = totals.remaining < 0;

  const cards = [
    { icon: Wallet, label: "Total budget", value: totals.totalBudget },
    { icon: ReceiptText, label: "Planned", value: totals.planned },
    { icon: PiggyBank, label: "Actual spend", value: totals.actual },
    { icon: TrendingDown, label: "Remaining", value: totals.remaining },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-charcoal-400">
                <card.icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
              </div>
              <p
                className={`mt-2 text-lg font-medium ${
                  card.label === "Remaining" && isOverBudget ? "text-red-600" : "text-charcoal"
                }`}
              >
                {card.value.toLocaleString()} {currency}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-5">
          <ProgressBar value={Math.min(100, spentPercent)} label="Spent of total budget" />
          {isOverBudget && (
            <p className="mt-2 text-xs text-red-600">
              You&apos;re {Math.abs(totals.remaining).toLocaleString()} {currency} over budget.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

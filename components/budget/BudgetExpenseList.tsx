"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ReceiptText, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { deleteExpense, toggleExpensePaid } from "@/app/dashboard/events/[id]/budget/actions";
import { EXPENSE_CATEGORY_OPTIONS } from "@/types/budget";
import type { BudgetExpenseRecord } from "@/types/budget";
import type { EventVendorOption } from "@/lib/data/budget";
import { BudgetExpenseFormModal } from "@/components/budget/BudgetExpenseFormModal";

function categoryLabel(value: string) {
  return EXPENSE_CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export function BudgetExpenseList({
  eventId,
  initialExpenses,
  vendors,
  currency,
}: {
  eventId: string;
  initialExpenses: BudgetExpenseRecord[];
  vendors: EventVendorOption[];
  currency: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [expenses, setExpenses] = React.useState(initialExpenses);
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [paidFilter, setPaidFilter] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<BudgetExpenseRecord | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  React.useEffect(() => setExpenses(initialExpenses), [initialExpenses]);

  const usedCategories = React.useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))),
    [expenses]
  );

  const filtered = expenses.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (paidFilter === "paid" && !e.is_paid) return false;
    if (paidFilter === "unpaid" && e.is_paid) return false;
    if (query && !e.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function vendorName(vendorId: string | null) {
    if (!vendorId) return null;
    return vendors.find((v) => v.id === vendorId)?.business_name ?? null;
  }

  function openAdd() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function openEdit(expense: BudgetExpenseRecord) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditingExpense(null);
    router.refresh();
  }

  async function handleTogglePaid(expense: BudgetExpenseRecord) {
    setPendingId(expense.id);
    const nextPaid = !expense.is_paid;
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? { ...e, is_paid: nextPaid } : e)));
    const result = await toggleExpensePaid(eventId, expense.id, nextPaid);
    setPendingId(null);
    if (!result.ok) {
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? { ...e, is_paid: expense.is_paid } : e)));
      toast({ variant: "error", title: "Couldn't update expense", description: result.error });
    }
  }

  async function handleDelete(expense: BudgetExpenseRecord) {
    setPendingId(expense.id);
    const result = await deleteExpense(eventId, expense.id);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't remove expense", description: result.error });
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    toast({ variant: "success", title: "Expense removed" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search expenses…" className="max-w-xs" />
        {usedCategories.length > 0 && (
          <Select
            className="w-44"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "", label: "All categories" },
              ...usedCategories.map((c) => ({ value: c, label: categoryLabel(c) })),
            ]}
          />
        )}
        <Select
          className="w-36"
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          options={[
            { value: "", label: "All" },
            { value: "paid", label: "Paid" },
            { value: "unpaid", label: "Unpaid" },
          ]}
        />
        <div className="ml-auto">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add Expense
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-6 w-6" />}
          title="No expenses yet"
          description="Add your first expense, or apply the AI Planner's budget allocation above."
          actionLabel="Add Expense"
          onAction={openAdd}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No expenses match your filters" description="Try clearing the search or filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium text-charcoal">
                    {expense.title}
                    {expense.source === "ai" && (
                      <Badge variant="purple">
                        <Sparkles className="h-3 w-3" /> AI
                      </Badge>
                    )}
                  </p>
                  {expense.notes && <p className="text-xs text-charcoal-400">{expense.notes}</p>}
                </TableCell>
                <TableCell>{categoryLabel(expense.category)}</TableCell>
                <TableCell>{vendorName(expense.vendor_id) || "—"}</TableCell>
                <TableCell className="text-right">
                  {expense.planned_amount.toLocaleString()} {currency}
                </TableCell>
                <TableCell className="text-right">
                  {expense.actual_amount.toLocaleString()} {currency}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={expense.is_paid}
                    onChange={() => handleTogglePaid(expense)}
                    disabled={pendingId === expense.id}
                    aria-label={`Mark "${expense.title}" as ${expense.is_paid ? "unpaid" : "paid"}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label={`Edit ${expense.title}`}
                      onClick={() => openEdit(expense)}
                      className="rounded-full p-1.5 text-charcoal-400 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Remove ${expense.title}`}
                      onClick={() => handleDelete(expense)}
                      disabled={pendingId === expense.id}
                      className="rounded-full p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BudgetExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eventId={eventId}
        expense={editingExpense}
        vendors={vendors}
        onSaved={handleSaved}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { saveExpense } from "@/app/dashboard/events/[id]/budget/actions";
import { EXPENSE_CATEGORY_OPTIONS } from "@/types/budget";
import type { BudgetExpenseRecord } from "@/types/budget";
import type { EventVendorOption } from "@/lib/data/budget";

const schema = z.object({
  category: z.string().min(1, "Choose a category"),
  title: z.string().trim().min(2, "Give the expense a title").max(160),
  plannedAmount: z.coerce.number().min(0),
  actualAmount: z.coerce.number().min(0),
  isPaid: z.boolean(),
  vendorId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  category: "",
  title: "",
  plannedAmount: 0,
  actualAmount: 0,
  isPaid: false,
  vendorId: "",
  notes: "",
};

function toFormValues(expense: BudgetExpenseRecord): FormValues {
  return {
    category: expense.category,
    title: expense.title,
    plannedAmount: expense.planned_amount,
    actualAmount: expense.actual_amount,
    isPaid: expense.is_paid,
    vendorId: expense.vendor_id ?? "",
    notes: expense.notes ?? "",
  };
}

export function BudgetExpenseFormModal({
  open,
  onClose,
  eventId,
  expense,
  vendors,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  expense: BudgetExpenseRecord | null;
  vendors: EventVendorOption[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: expense ? toFormValues(expense) : emptyValues,
  });

  React.useEffect(() => {
    reset(expense ? toFormValues(expense) : emptyValues);
  }, [expense, open, reset]);

  async function onSubmit(values: FormValues) {
    const result = await saveExpense({
      eventId,
      expenseId: expense?.id,
      category: values.category,
      title: values.title,
      plannedAmount: values.plannedAmount,
      actualAmount: values.actualAmount,
      isPaid: values.isPaid,
      vendorId: values.vendorId || "",
      notes: values.notes || "",
    });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save expense", description: result.error });
      return;
    }
    toast({ variant: "success", title: expense ? "Expense updated" : "Expense added" });
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "Edit expense" : "Add expense"}
      description="Track what's planned versus what's actually been spent or paid."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input
          label="Title"
          placeholder="e.g. Banquet hall deposit"
          className="sm:col-span-2"
          error={errors.title?.message}
          {...register("title")}
        />
        <Select
          label="Category"
          placeholder="Choose a category"
          options={EXPENSE_CATEGORY_OPTIONS as unknown as { value: string; label: string }[]}
          error={errors.category?.message}
          {...register("category")}
        />
        {vendors.length > 0 && (
          <Select
            label="Vendor (optional)"
            options={[{ value: "", label: "No vendor" }, ...vendors.map((v) => ({ value: v.id, label: v.business_name }))]}
            {...register("vendorId")}
          />
        )}
        <Input
          type="number"
          min={0}
          step="0.01"
          label="Planned amount"
          error={errors.plannedAmount?.message}
          {...register("plannedAmount")}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          label="Actual amount"
          hint="What's actually been spent or paid so far"
          error={errors.actualAmount?.message}
          {...register("actualAmount")}
        />
        <div className="flex items-end pb-1 sm:col-span-2">
          <Checkbox label="Marked as paid" {...register("isPaid")} />
        </div>
        <Textarea
          label="Notes (optional)"
          className="sm:col-span-2"
          error={errors.notes?.message}
          {...register("notes")}
        />
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {expense ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

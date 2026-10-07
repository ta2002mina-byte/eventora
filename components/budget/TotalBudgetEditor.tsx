"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { setEventBudgetTotal } from "@/app/dashboard/events/[id]/budget/actions";

const schema = z.object({ totalAmount: z.coerce.number().min(0) });
type FormValues = z.infer<typeof schema>;

export function TotalBudgetEditor({
  eventId,
  totalAmount,
  currency,
}: {
  eventId: string;
  totalAmount: number;
  currency: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { totalAmount },
  });

  React.useEffect(() => reset({ totalAmount }), [totalAmount, reset]);

  async function onSubmit(values: FormValues) {
    const result = await setEventBudgetTotal({ eventId, totalAmount: values.totalAmount });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update total budget", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Total budget updated" });
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit total budget
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2" noValidate>
      <Input
        type="number"
        min={0}
        step="0.01"
        label={`Total budget (${currency})`}
        error={errors.totalAmount?.message}
        className="w-44"
        {...register("totalAmount")}
      />
      <Button type="submit" size="sm" isLoading={isSubmitting} leftIcon={<Check className="h-4 w-4" />}>
        Save
      </Button>
      <Button type="button" size="sm" variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </form>
  );
}

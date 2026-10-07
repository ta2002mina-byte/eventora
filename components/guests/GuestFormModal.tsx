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
import { saveGuest } from "@/app/dashboard/events/[id]/guests/actions";
import { RSVP_STATUS_OPTIONS } from "@/types/guest";
import type { GuestRecord, GuestTableRecord } from "@/types/guest";

const schema = z.object({
  name: z.string().trim().min(2, "Give the guest a name").max(160),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  groupName: z.string().trim().max(120).optional(),
  rsvpStatus: z.enum(["pending", "invited", "confirmed", "declined"]),
  mealPreference: z.string().trim().max(120).optional(),
  plusOne: z.boolean(),
  plusOneName: z.string().trim().max(160).optional(),
  tableId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  groupName: "",
  rsvpStatus: "pending",
  mealPreference: "",
  plusOne: false,
  plusOneName: "",
  tableId: "",
  notes: "",
};

function toFormValues(guest: GuestRecord): FormValues {
  return {
    name: guest.name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    groupName: guest.group_name ?? "",
    rsvpStatus: guest.rsvp_status,
    mealPreference: guest.meal_preference ?? "",
    plusOne: guest.plus_one,
    plusOneName: guest.plus_one_name ?? "",
    tableId: guest.table_id ?? "",
    notes: guest.notes ?? "",
  };
}

export function GuestFormModal({
  open,
  onClose,
  eventId,
  guest,
  tables,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  guest: GuestRecord | null;
  tables: GuestTableRecord[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: guest ? toFormValues(guest) : emptyValues,
  });

  React.useEffect(() => {
    reset(guest ? toFormValues(guest) : emptyValues);
  }, [guest, open, reset]);

  const plusOne = watch("plusOne");

  async function onSubmit(values: FormValues) {
    const result = await saveGuest({
      eventId,
      guestId: guest?.id,
      name: values.name,
      email: values.email || "",
      phone: values.phone || "",
      groupName: values.groupName || "",
      rsvpStatus: values.rsvpStatus,
      mealPreference: values.mealPreference || "",
      plusOne: values.plusOne,
      plusOneName: values.plusOneName || "",
      tableId: values.tableId || "",
      notes: values.notes || "",
    });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save guest", description: result.error });
      return;
    }
    toast({ variant: "success", title: guest ? "Guest updated" : "Guest added" });
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={guest ? "Edit guest" : "Add guest"}
      description="Keep track of who's coming and how to seat them."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Full name" className="sm:col-span-2" error={errors.name?.message} {...register("name")} />
        <Input label="Email (optional)" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Phone (optional)" error={errors.phone?.message} {...register("phone")} />
        <Input
          label="Group (optional)"
          placeholder="e.g. Bride's family"
          error={errors.groupName?.message}
          {...register("groupName")}
        />
        <Select
          label="RSVP status"
          options={RSVP_STATUS_OPTIONS as unknown as { value: string; label: string }[]}
          {...register("rsvpStatus")}
        />
        <Input
          label="Meal preference (optional)"
          placeholder="e.g. Vegetarian"
          error={errors.mealPreference?.message}
          {...register("mealPreference")}
        />
        <Select
          label="Table (optional)"
          options={[{ value: "", label: "Unassigned" }, ...tables.map((t) => ({ value: t.id, label: `${t.name} (${t.capacity} seats)` }))]}
          {...register("tableId")}
        />
        <div className="flex items-end pb-1">
          <Checkbox label="Bringing a plus-one" {...register("plusOne")} />
        </div>
        {plusOne && (
          <Input
            label="Plus-one name (optional)"
            className="sm:col-span-2"
            error={errors.plusOneName?.message}
            {...register("plusOneName")}
          />
        )}
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
            {guest ? "Save changes" : "Add guest"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateVendorBookingStatus } from "@/app/vendor/dashboard/actions";

const schema = z.object({ amount: z.coerce.number().min(0, "Amount can't be negative") });
type FormValues = z.infer<typeof schema>;

export function AcceptBookingModal({
  open,
  onClose,
  bookingId,
  suggestedAmount,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  suggestedAmount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: suggestedAmount },
  });

  React.useEffect(() => {
    reset({ amount: suggestedAmount });
  }, [suggestedAmount, open, reset]);

  async function onSubmit(values: FormValues) {
    const result = await updateVendorBookingStatus({
      bookingId,
      status: "confirmed",
      amount: values.amount,
    });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't accept booking", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Booking accepted" });
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accept booking"
      description="Confirm the agreed amount for this booking."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Input
          type="number"
          label="Agreed amount"
          min={0}
          error={errors.amount?.message}
          {...register("amount")}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Accept booking
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { saveVendorService } from "@/app/vendor/dashboard/actions";
import type { VendorService } from "@/types/vendor";

const schema = z.object({
  name: z.string().trim().min(2, "Name the service").max(160),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0, "Price can't be negative"),
  unit: z.string().trim().max(40).optional(),
});
type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: "", description: "", price: 0, unit: "per event" };

function toFormValues(service: VendorService): FormValues {
  return {
    name: service.name,
    description: service.description ?? "",
    price: service.price,
    unit: service.unit ?? "",
  };
}

export function ServiceFormModal({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service: VendorService | null;
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
    defaultValues: service ? toFormValues(service) : emptyValues,
  });

  React.useEffect(() => {
    reset(service ? toFormValues(service) : emptyValues);
  }, [service, open, reset]);

  async function onSubmit(values: FormValues) {
    const result = await saveVendorService({ ...values, serviceId: service?.id });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save service", description: result.error });
      return;
    }
    toast({ variant: "success", title: service ? "Service updated" : "Service added" });
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? "Edit service" : "Add service"}
      description="À la carte services customers can request individually."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Input label="Service name" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" label="Price" min={0} error={errors.price?.message} {...register("price")} />
          <Input
            label="Unit"
            placeholder="e.g. per event, per hour"
            error={errors.unit?.message}
            {...register("unit")}
          />
        </div>
        <Textarea label="Description (optional)" error={errors.description?.message} {...register("description")} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {service ? "Save changes" : "Add service"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

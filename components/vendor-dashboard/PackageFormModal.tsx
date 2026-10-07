"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { saveVendorPackage } from "@/app/vendor/dashboard/actions";
import type { VendorPackage } from "@/types/vendor";

const schema = z.object({
  name: z.string().trim().min(2, "Name the package").max(160),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0, "Price can't be negative"),
  duration: z.string().trim().max(80).optional(),
  includedServices: z.string().trim().max(1000).optional(),
  isPopular: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: "",
  description: "",
  price: 0,
  duration: "",
  includedServices: "",
  isPopular: false,
};

function toFormValues(pkg: VendorPackage): FormValues {
  return {
    name: pkg.name,
    description: pkg.description ?? "",
    price: pkg.price,
    duration: pkg.duration ?? "",
    includedServices: pkg.included_services.join("\n"),
    isPopular: pkg.is_popular,
  };
}

export function PackageFormModal({
  open,
  onClose,
  pkg,
}: {
  open: boolean;
  onClose: () => void;
  pkg: VendorPackage | null;
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
    defaultValues: pkg ? toFormValues(pkg) : emptyValues,
  });

  React.useEffect(() => {
    reset(pkg ? toFormValues(pkg) : emptyValues);
  }, [pkg, open, reset]);

  async function onSubmit(values: FormValues) {
    const result = await saveVendorPackage({ ...values, packageId: pkg?.id });
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save package", description: result.error });
      return;
    }
    toast({ variant: "success", title: pkg ? "Package updated" : "Package added" });
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pkg ? "Edit package" : "Add package"}
      description="A bundled offering with a fixed price customers can request directly."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Input label="Package name" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" label="Price" min={0} error={errors.price?.message} {...register("price")} />
          <Input
            label="Duration"
            placeholder="e.g. Full day, 4 hours"
            error={errors.duration?.message}
            {...register("duration")}
          />
        </div>
        <Textarea label="Description (optional)" error={errors.description?.message} {...register("description")} />
        <Textarea
          label="Included services (one per line)"
          placeholder={"8 hours of coverage\nTwo photographers\nEdited online gallery"}
          error={errors.includedServices?.message}
          {...register("includedServices")}
        />
        <Checkbox label="Mark as popular" {...register("isPopular")} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {pkg ? "Save changes" : "Add package"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

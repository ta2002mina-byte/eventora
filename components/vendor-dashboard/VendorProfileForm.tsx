"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateVendorProfile } from "@/app/vendor/dashboard/actions";
import type { VendorProfileInput } from "@/app/vendor/dashboard/actions";
import { VENDOR_CATEGORY_OPTIONS } from "@/types/vendor";
import type { VendorRecord } from "@/types/vendor";

const schema = z.object({
  businessName: z.string().trim().min(2, "Give your business a name").max(120),
  category: z.string().min(1, "Choose a category"),
  description: z.string().trim().max(2000).optional(),
  city: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  serviceArea: z.string().trim().max(400).optional(),
  startingPrice: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(8).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  contactEmail: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional(),
  logoUrl: z.string().trim().max(2000).optional(),
  coverImageUrl: z.string().trim().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function VendorProfileForm({ vendor }: { vendor: VendorRecord }) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: vendor.business_name,
      category: vendor.category,
      description: vendor.description ?? "",
      city: vendor.city ?? "",
      address: vendor.address ?? "",
      serviceArea: vendor.service_area.join(", "),
      startingPrice: vendor.starting_price,
      currency: vendor.currency,
      yearsExperience: vendor.years_experience,
      contactEmail: vendor.contact_email ?? "",
      contactPhone: vendor.contact_phone ?? "",
      logoUrl: vendor.logo_url ?? "",
      coverImageUrl: vendor.cover_image_url ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateVendorProfile(values as unknown as VendorProfileInput);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save profile", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Profile updated" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Input
        label="Business name"
        className="sm:col-span-2"
        error={errors.businessName?.message}
        {...register("businessName")}
      />
      <Select
        label="Category"
        options={VENDOR_CATEGORY_OPTIONS}
        error={errors.category?.message}
        {...register("category")}
      />
      <Input label="City" error={errors.city?.message} {...register("city")} />
      <Input
        label="Address (optional)"
        className="sm:col-span-2"
        error={errors.address?.message}
        {...register("address")}
      />
      <Input
        label="Service area (comma-separated)"
        className="sm:col-span-2"
        placeholder="e.g. Dhaka, Gazipur, Narayanganj"
        error={errors.serviceArea?.message}
        {...register("serviceArea")}
      />
      <Input
        type="number"
        label="Starting price"
        min={0}
        error={errors.startingPrice?.message}
        {...register("startingPrice")}
      />
      <Input label="Currency" error={errors.currency?.message} {...register("currency")} />
      <Input
        type="number"
        label="Years of experience"
        min={0}
        error={errors.yearsExperience?.message}
        {...register("yearsExperience")}
      />
      <Input
        type="email"
        label="Contact email"
        error={errors.contactEmail?.message}
        {...register("contactEmail")}
      />
      <Input label="Contact phone" error={errors.contactPhone?.message} {...register("contactPhone")} />
      <Input
        label="Logo / profile image URL (optional)"
        placeholder="https://…"
        error={errors.logoUrl?.message}
        {...register("logoUrl")}
      />
      <Input
        label="Cover image URL (optional)"
        placeholder="https://…"
        error={errors.coverImageUrl?.message}
        {...register("coverImageUrl")}
      />
      <Textarea
        label="Description"
        className="sm:col-span-2"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="sm:col-span-2">
        <Button type="submit" isLoading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

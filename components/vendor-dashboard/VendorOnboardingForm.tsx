"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createVendorProfile } from "@/app/vendor/dashboard/actions";
import type { VendorProfileInput } from "@/app/vendor/dashboard/actions";
import { VENDOR_CATEGORY_OPTIONS } from "@/types/vendor";

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
});

type FormValues = z.infer<typeof schema>;

export function VendorOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      category: "",
      description: "",
      city: "",
      address: "",
      serviceArea: "",
      startingPrice: 0,
      currency: "BDT",
      yearsExperience: 0,
      contactEmail: "",
      contactPhone: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await createVendorProfile(values as unknown as VendorProfileInput);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't create profile", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Vendor profile created" });
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input
            label="Business name"
            className="sm:col-span-2"
            error={errors.businessName?.message}
            {...register("businessName")}
          />
          <Select
            label="Category"
            placeholder="Choose a category"
            options={VENDOR_CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register("category")}
          />
          <Input label="City" placeholder="e.g. Dhaka" error={errors.city?.message} {...register("city")} />
          <Input
            label="Address (optional)"
            className="sm:col-span-2"
            error={errors.address?.message}
            {...register("address")}
          />
          <Input
            label="Service area (comma-separated, optional)"
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
          <Input label="Currency" placeholder="BDT" error={errors.currency?.message} {...register("currency")} />
          <Input
            type="number"
            label="Years of experience"
            min={0}
            error={errors.yearsExperience?.message}
            {...register("yearsExperience")}
          />
          <Input
            type="email"
            label="Contact email (optional)"
            error={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
          <Input
            label="Contact phone (optional)"
            className="sm:col-span-2"
            error={errors.contactPhone?.message}
            {...register("contactPhone")}
          />
          <Textarea
            label="Description"
            className="sm:col-span-2"
            placeholder="Tell customers what makes your business great…"
            error={errors.description?.message}
            {...register("description")}
          />
          <Button
            type="submit"
            className="sm:col-span-2"
            isLoading={isSubmitting}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Create vendor profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

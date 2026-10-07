"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { requestVenueBooking } from "@/app/venues/actions";

const schema = z.object({
  eventName: z.string().trim().min(2, "Tell us what the event is").max(120),
  eventDate: z
    .string()
    .min(1, "Choose a date")
    .refine((v) => new Date(v) >= new Date(new Date().toDateString()), "Date must be in the future"),
  eventTime: z.string().optional(),
  guestCount: z.coerce.number().int().min(1, "At least 1 guest").max(20000, "That's a lot of guests"),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function BookingRequestForm({
  venueId,
  isAuthenticated,
  maxCapacity,
}: {
  venueId: string;
  isAuthenticated: boolean;
  maxCapacity: number;
}) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { eventName: "", eventDate: "", eventTime: "", guestCount: 50, notes: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await requestVenueBooking({ venueId, ...values });
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
      toast({ variant: "error", title: "Couldn't send request", description: result.error });
      return;
    }
    setSubmitted(true);
    toast({
      variant: "success",
      title: "Request sent",
      description: "The venue will get back to you shortly.",
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center">
        <p className="text-sm text-charcoal-600">Sign in to request a booking for this venue.</p>
        <Link href="/auth/login" className="mt-3 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="text-sm font-medium text-charcoal">Booking request sent</p>
        <p className="text-xs text-charcoal-400">
          The venue typically responds within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Event name"
        placeholder="e.g. Rahim & Amina's Wedding"
        error={errors.eventName?.message}
        {...register("eventName")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Event date"
          error={errors.eventDate?.message}
          {...register("eventDate")}
        />
        <Input
          type="time"
          label="Event time"
          error={errors.eventTime?.message}
          {...register("eventTime")}
        />
      </div>
      <Input
        type="number"
        label="Guest count"
        min={1}
        hint={maxCapacity ? `This venue holds up to ${maxCapacity.toLocaleString()} guests.` : undefined}
        error={errors.guestCount?.message}
        {...register("guestCount")}
      />
      <Textarea
        label="Notes"
        placeholder="Anything the venue should know (theme, setup time, special requests)…"
        error={errors.notes?.message}
        {...register("notes")}
      />
      <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
        Send Booking Request
      </Button>
    </form>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { createEvent } from "@/app/dashboard/events/actions";
import { EVENT_TYPE_OPTIONS } from "@/types/planner";

const schema = z.object({
  title: z.string().trim().min(2, "Give your event a name").max(120),
  eventType: z.string().min(1, "Choose an event type"),
  description: z.string().max(2000).optional(),
  startDate: z.string().min(1, "Choose a start date"),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  city: z.string().max(120).optional(),
  locationName: z.string().max(160).optional(),
  guestCount: z.coerce.number().int().min(1).max(50000).optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().or(z.literal("")),
  coverImageUrl: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function EventCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", eventType: "", startDate: "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await createEvent({
      title: values.title,
      eventType: values.eventType,
      description: values.description || "",
      startDate: values.startDate,
      endDate: values.endDate || "",
      startTime: values.startTime || "",
      endTime: values.endTime || "",
      city: values.city || "",
      locationName: values.locationName || "",
      guestCount: values.guestCount === "" ? undefined : Number(values.guestCount),
      budget: values.budget === "" ? undefined : Number(values.budget),
      coverImageUrl: values.coverImageUrl || "",
      visibility: "private",
      notes: values.notes || "",
    });

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message });
        }
      }
      toast({ variant: "error", title: "Couldn't create event", description: result.error });
      return;
    }

    toast({ variant: "success", title: "Event created" });
    router.push(`/dashboard/events/${result.eventId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Input
        label="Event name"
        placeholder="e.g. Rahim & Amina's Wedding"
        className="sm:col-span-2"
        error={errors.title?.message}
        {...register("title")}
      />
      <Select
        label="Event type"
        placeholder="Choose an event type"
        options={EVENT_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
        error={errors.eventType?.message}
        {...register("eventType")}
      />
      <ImageUpload
        label="Cover image (optional)"
        folder="events"
        value={watch("coverImageUrl")}
        onChange={(url) => setValue("coverImageUrl", url, { shouldValidate: true })}
        className="sm:col-span-2"
      />
      <Textarea
        label="Description"
        placeholder="What's this event about?"
        className="sm:col-span-2"
        error={errors.description?.message}
        {...register("description")}
      />
      <Input type="date" label="Start date" error={errors.startDate?.message} {...register("startDate")} />
      <Input type="date" label="End date (optional)" error={errors.endDate?.message} {...register("endDate")} />
      <Input type="time" label="Start time (optional)" error={errors.startTime?.message} {...register("startTime")} />
      <Input type="time" label="End time (optional)" error={errors.endTime?.message} {...register("endTime")} />
      <Input
        label="City"
        placeholder="e.g. Dhaka"
        error={errors.city?.message}
        {...register("city")}
      />
      <Input
        label="Venue / location name (optional)"
        placeholder="e.g. Grand Ballroom"
        error={errors.locationName?.message}
        {...register("locationName")}
      />
      <Input
        type="number"
        min={1}
        label="Guest count (optional)"
        placeholder="e.g. 500"
        error={errors.guestCount?.message}
        {...register("guestCount")}
      />
      <Input
        type="number"
        min={0}
        label="Budget (optional, BDT)"
        placeholder="e.g. 800000"
        error={errors.budget?.message}
        {...register("budget")}
      />
      <Textarea
        label="Notes (optional)"
        placeholder="Anything you want to remember about this event"
        className="sm:col-span-2"
        error={errors.notes?.message}
        {...register("notes")}
      />
      <div className="sm:col-span-2">
        <Button type="submit" isLoading={isSubmitting} leftIcon={<CalendarPlus className="h-4 w-4" />}>
          Create Event
        </Button>
      </div>
    </form>
  );
}

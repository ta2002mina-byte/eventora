"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { generatePlan } from "@/app/ai-planner/actions";
import { EVENT_TYPE_OPTIONS } from "@/types/planner";
import type { AiPlanResult } from "@/types/planner";
import { AiPlanResultView } from "@/components/planner/AiPlanResultView";

const schema = z.object({
  eventType: z.string().min(1, "Choose an event type"),
  location: z.string().max(120).optional(),
  guestCount: z.coerce.number().int().min(1).max(50000).optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().or(z.literal("")),
  eventDate: z.string().optional(),
  theme: z.string().max(120).optional(),
  venuePreference: z.string().max(200).optional(),
  requirements: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function AiPlannerForm({
  eventId,
  isAuthenticated,
  defaultValues,
}: {
  eventId?: string;
  isAuthenticated: boolean;
  defaultValues?: Partial<FormValues>;
}) {
  const { toast } = useToast();
  const [plan, setPlan] = React.useState<AiPlanResult | null>(null);
  const [planId, setPlanId] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [submittedValues, setSubmittedValues] = React.useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventType: defaultValues?.eventType ?? "",
      location: defaultValues?.location ?? "",
      guestCount: defaultValues?.guestCount ?? undefined,
      budget: defaultValues?.budget ?? undefined,
      eventDate: defaultValues?.eventDate ?? "",
      theme: defaultValues?.theme ?? "",
      venuePreference: defaultValues?.venuePreference ?? "",
      requirements: defaultValues?.requirements ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setGenerating(true);
    setPlan(null);
    try {
      const result = await generatePlan({
        ...values,
        guestCount: values.guestCount === "" ? undefined : Number(values.guestCount),
        budget: values.budget === "" ? undefined : Number(values.budget),
        eventId,
      });
      if (!result.ok || !result.plan) {
        toast({ variant: "error", title: "Couldn't generate a plan", description: result.error });
        return;
      }
      setPlan(result.plan);
      setPlanId(result.planId ?? null);
      setSubmittedValues(values);
      toast({ variant: "success", title: "Your event plan is ready" });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Select
          label="Event type"
          placeholder="Choose an event type"
          options={EVENT_TYPE_OPTIONS as unknown as { value: string; label: string }[]}
          error={errors.eventType?.message}
          {...register("eventType")}
        />
        <Input
          label="Location"
          placeholder="e.g. Dhaka"
          error={errors.location?.message}
          {...register("location")}
        />
        <Input
          type="number"
          min={1}
          label="Guest count"
          placeholder="e.g. 500"
          error={errors.guestCount?.message}
          {...register("guestCount")}
        />
        <Input
          type="number"
          min={0}
          label="Budget (BDT)"
          placeholder="e.g. 800000"
          hint="e.g. 8 lakh BDT"
          error={errors.budget?.message}
          {...register("budget")}
        />
        <Input type="date" label="Event date" error={errors.eventDate?.message} {...register("eventDate")} />
        <Input
          label="Theme (optional)"
          placeholder="e.g. Royal Purple & Gold"
          error={errors.theme?.message}
          {...register("theme")}
        />
        <Input
          label="Venue preference (optional)"
          placeholder="e.g. Indoor banquet hall"
          className="sm:col-span-2"
          error={errors.venuePreference?.message}
          {...register("venuePreference")}
        />
        <Textarea
          label="Requirements (optional)"
          placeholder="Anything specific the plan should account for"
          className="sm:col-span-2"
          error={errors.requirements?.message}
          {...register("requirements")}
        />
        <Textarea
          label="Notes (optional)"
          placeholder="Anything else Eventora should know"
          className="sm:col-span-2"
          error={errors.notes?.message}
          {...register("notes")}
        />
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={generating} leftIcon={<Wand2 className="h-4 w-4" />}>
            Generate My Event Plan
          </Button>
        </div>
      </form>

      {generating && (
        <div className="rounded-card border border-dashed border-border bg-purple-50/30 p-8 text-center text-sm text-charcoal-400">
          Building your personalized event plan…
        </div>
      )}

      {plan && !generating && submittedValues && (
        <AiPlanResultView
          plan={plan}
          planId={planId}
          eventId={eventId ?? null}
          isAuthenticated={isAuthenticated}
          saveDefaults={{
            eventType: submittedValues.eventType,
            location: submittedValues.location || undefined,
            guestCount:
              submittedValues.guestCount === "" || submittedValues.guestCount === undefined
                ? undefined
                : Number(submittedValues.guestCount),
            budget:
              submittedValues.budget === "" || submittedValues.budget === undefined
                ? undefined
                : Number(submittedValues.budget),
            eventDate: submittedValues.eventDate || undefined,
          }}
        />
      )}
    </div>
  );
}

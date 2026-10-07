"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus, Ticket as TicketIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createBooking } from "@/app/booking/[id]/actions";
import { ticketAvailability } from "@/types/event";
import type { EventTicketType } from "@/types/event";

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter the ticket holder's name").max(120),
  customerEmail: z.string().trim().email("Enter a valid email"),
  customerPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export function BookingForm({
  eventId,
  currency,
  startingPrice,
  ticketTypes,
  defaultEmail,
}: {
  eventId: string;
  currency: string;
  startingPrice: number;
  ticketTypes: EventTicketType[];
  defaultEmail?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const hasTiers = ticketTypes.length > 0;
  const [quantities, setQuantities] = React.useState<Record<string, number>>(
    hasTiers ? {} : { general: 0 }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", customerEmail: defaultEmail ?? "", customerPhone: "", notes: "" },
  });

  function setQty(key: string, delta: number, max: number) {
    setQuantities((prev) => {
      const next = Math.min(max, Math.max(0, (prev[key] ?? 0) + delta));
      return { ...prev, [key]: next };
    });
  }

  const lines = hasTiers
    ? ticketTypes.map((t) => ({
        key: t.id,
        name: t.name,
        price: t.price,
        remaining: ticketAvailability(t),
        quantity: quantities[t.id] ?? 0,
      }))
    : [{ key: "general", name: "General Admission", price: startingPrice, remaining: 999, quantity: quantities.general ?? 0 }];

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  async function onSubmit(values: FormValues) {
    if (totalQuantity === 0) {
      toast({ variant: "error", title: "Select at least one ticket" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBooking({
        eventId,
        items: lines.map((l) => ({
          ticketTypeId: hasTiers ? l.key : null,
          quantity: l.quantity,
        })),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone || "",
        notes: values.notes || "",
      });
      if (!result.ok || !result.bookingId) {
        toast({ variant: "error", title: "Couldn't start checkout", description: result.error });
        return;
      }
      router.push(`/checkout/${result.bookingId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <h2 className="flex items-center gap-2 text-base font-medium text-charcoal">
          <TicketIcon className="h-4 w-4 text-purple-700" /> Select tickets
        </h2>
        <div className="mt-3 space-y-3">
          {lines.map((line) => {
            const soldOut = line.remaining <= 0;
            return (
              <div
                key={line.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-charcoal">{line.name}</p>
                  <p className="text-xs text-charcoal-400">
                    {line.price > 0 ? `${currency} ${line.price.toLocaleString()}` : "Free"}
                    {soldOut ? " · Sold out" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${line.name} quantity`}
                    onClick={() => setQty(line.key, -1, line.remaining)}
                    disabled={line.quantity === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal-600 hover:bg-purple-50 disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${line.name} quantity`}
                    onClick={() => setQty(line.key, 1, line.remaining)}
                    disabled={soldOut || line.quantity >= Math.min(line.remaining, 10)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal-600 hover:bg-purple-50 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Ticket holder name"
          placeholder="Full name"
          error={errors.customerName?.message}
          {...register("customerName")}
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.customerEmail?.message}
          {...register("customerEmail")}
        />
        <Input
          type="tel"
          label="Phone (optional)"
          placeholder="e.g. 01xxxxxxxxx"
          error={errors.customerPhone?.message}
          {...register("customerPhone")}
        />
      </div>
      <Textarea
        label="Notes (optional)"
        placeholder="Anything the organizer should know"
        error={errors.notes?.message}
        {...register("notes")}
      />

      <div className="flex items-center justify-between rounded-xl bg-purple-50/60 p-4">
        <span className="text-sm text-charcoal-600">
          {totalQuantity} ticket{totalQuantity === 1 ? "" : "s"}
        </span>
        <span className="text-lg font-medium text-charcoal">
          {total > 0 ? `${currency} ${total.toLocaleString()}` : "Free"}
        </span>
      </div>

      <Button type="submit" className="w-full" isLoading={submitting} disabled={totalQuantity === 0}>
        Continue to Checkout
      </Button>
    </form>
  );
}

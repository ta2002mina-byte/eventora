"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, CreditCard, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { payForBooking, cancelBooking, initiateSslcommerzCheckout } from "@/app/checkout/[id]/actions";
import type { TicketItemRecord } from "@/types/booking";

const cardSchema = z.object({
  cardholderName: z.string().trim().min(2, "Enter the name on the card"),
  cardNumber: z
    .string()
    .trim()
    .regex(/^[\d\s]{12,19}$/, "Enter a valid card number"),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/YY"),
  cvv: z.string().trim().regex(/^\d{3,4}$/, "3–4 digits"),
});

type CardValues = z.infer<typeof cardSchema>;

export function CheckoutForm({
  bookingId,
  currency,
  subtotal,
  items,
  isGatewayConfigured = false,
}: {
  bookingId: string;
  currency: string;
  subtotal: number;
  items: TicketItemRecord[];
  /** True once real SSLCommerz credentials are set — shows the real gateway button instead of the dev card form. */
  isGatewayConfigured?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [paying, setPaying] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const isFree = subtotal <= 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { cardholderName: "", cardNumber: "", expiry: "", cvv: "" },
  });

  async function finalize(cardLast4?: string) {
    setPaying(true);
    try {
      const result = await payForBooking({ bookingId, cardLast4 });
      if (!result.ok) {
        toast({ variant: "error", title: "Payment failed", description: result.error });
        return;
      }
      router.push(`/payment/success?bookingId=${bookingId}`);
    } finally {
      setPaying(false);
    }
  }

  async function onPayCard(values: CardValues) {
    const digitsOnly = values.cardNumber.replace(/\s+/g, "");
    await finalize(digitsOnly.slice(-4));
  }

  async function onConfirmFree() {
    await finalize(undefined);
  }

  async function onPayWithGateway() {
    setPaying(true);
    try {
      const result = await initiateSslcommerzCheckout(bookingId);
      if (!result.ok || !result.gatewayUrl) {
        toast({ variant: "error", title: "Couldn't start payment", description: result.error });
        setPaying(false);
        return;
      }
      window.location.href = result.gatewayUrl; // hand off to SSLCommerz's hosted page
    } catch {
      toast({ variant: "error", title: "Couldn't start payment" });
      setPaying(false);
    }
  }

  async function onCancel() {
    setCancelling(true);
    try {
      const result = await cancelBooking(bookingId);
      if (!result.ok) {
        toast({ variant: "error", title: "Couldn't cancel", description: result.error });
        return;
      }
      router.push(`/payment/cancel?bookingId=${bookingId}`);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        {isFree ? (
          <div className="space-y-4">
            <p className="text-sm text-charcoal-600">
              This order is free — confirm your registration to get your tickets.
            </p>
            <Button className="w-full" isLoading={paying} onClick={onConfirmFree}>
              Confirm Registration
            </Button>
          </div>
        ) : isGatewayConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <ShieldCheck className="h-4 w-4 text-purple-700" /> Secure payment
            </div>
            <p className="rounded-lg bg-lavender-100/60 p-3 text-xs text-charcoal-400">
              You&apos;ll be redirected to SSLCommerz to pay securely by card, bKash, Nagad, or Rocket.
            </p>
            <Button
              className="w-full"
              isLoading={paying}
              onClick={onPayWithGateway}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              Pay {currency} {subtotal.toLocaleString()}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onPayCard)} className="space-y-4" noValidate>
            <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
              <CreditCard className="h-4 w-4 text-purple-700" /> Payment details
            </div>
            <p className="rounded-lg bg-lavender-100/60 p-3 text-xs text-charcoal-400">
              Development/test checkout — no real charge is made and no card data is stored.
              Use any values (e.g. 4242 4242 4242 4242).
            </p>
            <Input
              label="Cardholder name"
              placeholder="Name on card"
              error={errors.cardholderName?.message}
              {...register("cardholderName")}
            />
            <Input
              label="Card number"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              error={errors.cardNumber?.message}
              {...register("cardNumber")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Expiry" placeholder="MM/YY" error={errors.expiry?.message} {...register("expiry")} />
              <Input label="CVV" placeholder="123" inputMode="numeric" error={errors.cvv?.message} {...register("cvv")} />
            </div>
            <Button type="submit" className="w-full" isLoading={paying} leftIcon={<Lock className="h-4 w-4" />}>
              Pay {currency} {subtotal.toLocaleString()}
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling || paying}
          className="mt-4 w-full text-center text-sm text-charcoal-400 hover:text-red-600 disabled:opacity-50"
        >
          Cancel this order
        </button>
      </div>

      <div className="h-fit rounded-card border border-border bg-white p-5 shadow-softer">
        <h2 className="text-sm font-medium text-charcoal">Order summary</h2>
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-charcoal-600">
                {item.name} × {item.quantity}
              </span>
              <span className="text-charcoal">
                {item.subtotal > 0 ? `${currency} ${item.subtotal.toLocaleString()}` : "Free"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium text-charcoal">Total</span>
          <span className="text-lg font-medium text-charcoal">
            {subtotal > 0 ? `${currency} ${subtotal.toLocaleString()}` : "Free"}
          </span>
        </div>
      </div>
    </div>
  );
}

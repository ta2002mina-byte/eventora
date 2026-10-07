import "server-only";
import type { PaymentProvider } from "@/services/payments/provider";
import { devPaymentProvider } from "@/services/payments/providers/dev";

/**
 * Active provider is chosen at request time via PAYMENT_PROVIDER
 * (server env, never exposed to the client). Defaults to the dev/test
 * provider so checkout works out of the box with no gateway configured.
 */
export function getPaymentProvider(): PaymentProvider {
  const selected = (process.env.PAYMENT_PROVIDER ?? "dev").toLowerCase();
  switch (selected) {
    case "dev":
    default:
      return devPaymentProvider;
  }
}

export type { PaymentProvider } from "@/services/payments/provider";

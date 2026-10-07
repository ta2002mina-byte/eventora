import "server-only";
import type { PaymentProvider } from "@/services/payments/provider";

/**
 * A clearly separated development/test payment flow (per Phase 10's
 * security rules): no real gateway, no card data collected beyond a
 * cosmetic last-4 for the receipt, and every charge is approved.
 * Swap in a real provider by adding one under providers/ and
 * selecting it in services/payments/index.ts — never hardcode a
 * specific gateway into app code.
 */
export const devPaymentProvider: PaymentProvider = {
  name: "dev",

  async charge(input) {
    if (input.amount < 0) {
      return { ok: false, error: "Invalid amount." };
    }
    // Simulate gateway processing latency.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      ok: true,
      reference: `dev_${input.bookingId.slice(0, 8)}_${Date.now().toString(36)}`,
    };
  },
};

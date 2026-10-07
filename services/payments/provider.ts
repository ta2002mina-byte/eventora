import "server-only";

export interface ChargeInput {
  bookingId: string;
  amount: number;
  currency: string;
  /** Last 4 digits only — the app never collects or stores a full PAN, CVV, or expiry. */
  cardLast4?: string;
}

export interface ChargeResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

/**
 * Provider-agnostic payment interface. Every provider under
 * services/payments/providers/* implements this so app code never
 * depends on a specific gateway. Select the active provider via
 * services/payments/index.ts. Never store card numbers, CVV, or any
 * raw payment credentials in any provider implementation.
 *
 * Note: redirect-based gateways (SSLCommerz) don't fit this
 * synchronous shape and are wired separately — see
 * services/payments/providers/sslcommerz.ts and
 * app/checkout/[id]/actions.ts (initiateSslcommerzCheckout).
 */
export interface PaymentProvider {
  readonly name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}

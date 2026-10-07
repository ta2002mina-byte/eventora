import "server-only";

/**
 * SSLCommerz integration (Bangladesh payment gateway).
 *
 * This is a redirect-based gateway, unlike the synchronous dev
 * provider: instead of charging in one call, we create a "session"
 * that returns a GatewayPageURL, redirect the customer there, and
 * SSLCommerz calls back our success/fail/cancel/ipn routes once the
 * customer finishes on their page. See:
 * app/checkout/[id]/actions.ts (initiateSslcommerzCheckout) and
 * app/api/payments/sslcommerz/* (the callback routes) for the rest
 * of the flow.
 *
 * Setup: get store_id / store_passwd from a (free) sandbox account at
 * https://developer.sslcommerz.com, then set in .env.local:
 *   PAYMENT_PROVIDER=sslcommerz
 *   SSLCOMMERZ_STORE_ID=...
 *   SSLCOMMERZ_STORE_PASSWORD=...
 *   SSLCOMMERZ_MODE=sandbox   (or "live" once approved for production)
 */

export interface SslcommerzSessionInput {
  /** Used as SSLCommerz's tran_id — must be unique per attempt. We use the payments.id row. */
  paymentId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface SslcommerzSessionResult {
  ok: boolean;
  gatewayUrl?: string;
  error?: string;
}

function getConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePasswd = process.env.SSLCOMMERZ_STORE_PASSWORD;
  if (!storeId || !storePasswd) return null;

  const isLive = process.env.SSLCOMMERZ_MODE === "live";
  return {
    storeId,
    storePasswd,
    sessionUrl: isLive
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validationUrl: isLive
      ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  };
}

export function isSslcommerzConfigured(): boolean {
  return getConfig() !== null;
}

export async function createSslcommerzSession(
  input: SslcommerzSessionInput
): Promise<SslcommerzSessionResult> {
  const config = getConfig();
  if (!config) {
    return {
      ok: false,
      error: "SSLCommerz is not configured (missing SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD).",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const body = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePasswd,
    total_amount: input.amount.toFixed(2),
    currency: "BDT",
    tran_id: input.paymentId,
    success_url: `${siteUrl}/api/payments/sslcommerz/success`,
    fail_url: `${siteUrl}/api/payments/sslcommerz/fail`,
    cancel_url: `${siteUrl}/api/payments/sslcommerz/cancel`,
    ipn_url: `${siteUrl}/api/payments/sslcommerz/ipn`,
    cus_name: input.customerName,
    cus_email: input.customerEmail,
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: input.customerPhone || "N/A",
    shipping_method: "NO",
    product_name: "Eventora booking",
    product_category: "Event Ticket",
    product_profile: "general",
  });

  let response: Response;
  try {
    response = await fetch(config.sessionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    return { ok: false, error: "Couldn't reach SSLCommerz. Please try again." };
  }

  let data: { status?: string; GatewayPageURL?: string; failedreason?: string };
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "Unexpected response from SSLCommerz." };
  }

  if (data.status === "SUCCESS" && data.GatewayPageURL) {
    return { ok: true, gatewayUrl: data.GatewayPageURL };
  }
  return { ok: false, error: data.failedreason || "Could not start the SSLCommerz session." };
}

/**
 * Confirms a transaction is genuine and paid, per SSLCommerz's
 * server-to-server validation API. Always call this from a callback
 * route before trusting val_id/tran_id data posted by the browser —
 * the success_url POST body alone is not proof of payment.
 */
export async function validateSslcommerzTransaction(valId: string): Promise<boolean> {
  const config = getConfig();
  if (!config || !valId) return false;

  const url =
    `${config.validationUrl}?val_id=${encodeURIComponent(valId)}` +
    `&store_id=${encodeURIComponent(config.storeId)}` +
    `&store_passwd=${encodeURIComponent(config.storePasswd)}` +
    `&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.status === "VALID" || data.status === "VALIDATED";
  } catch {
    return false;
  }
}

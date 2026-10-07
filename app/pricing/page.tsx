import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const { pricing } = await getSiteSettings();
  const tiers = pricing.tiers;
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
          {pricing.heading}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal-400">
          {pricing.subheading}
        </p>
      </div>

      <div className={`grid gap-6 ${tiers.length >= 3 ? "lg:grid-cols-3" : tiers.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-card border p-6 sm:p-8 ${
              tier.featured
                ? "border-purple-700 bg-purple-700 text-warmwhite shadow-soft"
                : "border-border bg-white shadow-softer"
            }`}
          >
            <h2 className={`font-display text-xl ${tier.featured ? "text-warmwhite" : "text-charcoal"}`}>
              {tier.name}
            </h2>
            <p className={`mt-1.5 text-sm ${tier.featured ? "text-lavender-100" : "text-charcoal-400"}`}>
              {tier.description}
            </p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-3xl">{tier.price}</span>
              <span className={`text-sm ${tier.featured ? "text-lavender-100" : "text-charcoal-400"}`}>
                {tier.period}
              </span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? "text-gold-300" : "text-purple-700"}`} />
                  <span className={tier.featured ? "text-warmwhite" : "text-charcoal-600"}>{f}</span>
                </li>
              ))}
            </ul>

            <Link href={tier.href} className="mt-8">
              <Button
                className="w-full"
                variant={tier.featured ? "secondary" : "primary"}
              >
                {tier.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-charcoal-400">
        {pricing.footnote}{" "}
        <Link href="/contact" className="font-medium text-purple-700 hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getVendorBySlugOrId } from "@/lib/data/vendors";
import { Badge } from "@/components/ui/Badge";
import { VendorPortfolioGrid } from "@/components/vendors/VendorPortfolioGrid";
import { VENDOR_CATEGORY_LABELS } from "@/types/vendor";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vendor = await getVendorBySlugOrId(params.id);
  if (!vendor) return { title: "Portfolio not found" };
  return { title: `${vendor.business_name} — Portfolio` };
}

export default async function VendorPortfolioPage({ params }: PageProps) {
  const vendor = await getVendorBySlugOrId(params.id);
  if (!vendor) notFound();

  return (
    <main className="container-page py-10">
      <Link
        href={`/vendors/${vendor.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {vendor.business_name}
      </Link>

      <div className="mb-8">
        <Badge variant="purple">{VENDOR_CATEGORY_LABELS[vendor.category]}</Badge>
        <h1 className="mt-3 text-3xl sm:text-4xl">{vendor.business_name} — Portfolio</h1>
        <p className="mt-2 text-charcoal-400">
          {vendor.vendor_portfolio.length > 0
            ? `${vendor.vendor_portfolio.length} project${
                vendor.vendor_portfolio.length === 1 ? "" : "s"
              } from past events`
            : "This vendor hasn't uploaded any projects yet."}
        </p>
      </div>

      <VendorPortfolioGrid items={vendor.vendor_portfolio} />
    </main>
  );
}

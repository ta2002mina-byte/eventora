"use client";

import { VendorDashboardSectionError } from "@/components/vendor-dashboard/VendorDashboardSectionError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <VendorDashboardSectionError error={error} reset={reset} title="Couldn't load your customers" />;
}

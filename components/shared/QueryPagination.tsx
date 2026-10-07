"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";

/**
 * Binds the generic <Pagination> control to the current route's
 * `?page=` query param. Shared by every marketplace listing
 * (events, venues, and vendors in Phase 05) to avoid re-implementing
 * the same router/searchParams wiring per domain.
 */
export function QueryPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onPageChange(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  return <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} className="mt-10" />;
}

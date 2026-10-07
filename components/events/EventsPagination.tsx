"use client";

import { QueryPagination } from "@/components/shared/QueryPagination";

/**
 * Thin, backwards-compatible wrapper around the shared QueryPagination
 * component (moved to components/shared in Phase 04 so the venues —
 * and later vendors — marketplace can reuse the same URL-bound logic
 * instead of duplicating it).
 */
export function EventsPagination({ page, totalPages }: { page: number; totalPages: number }) {
  return <QueryPagination page={page} totalPages={totalPages} />;
}

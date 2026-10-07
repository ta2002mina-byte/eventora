"use client";

import { QueryPagination } from "@/components/shared/QueryPagination";

export function VenuesPagination({ page, totalPages }: { page: number; totalPages: number }) {
  return <QueryPagination page={page} totalPages={totalPages} />;
}

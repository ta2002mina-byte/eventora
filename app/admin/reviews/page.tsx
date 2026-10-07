import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { PAGE_SIZE, first, formatDateTime, pageParam } from "@/lib/admin/format";
import { PageHeader, Pager, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { deleteReview, setReviewStatus } from "./actions";

export const metadata = { title: "Reviews" };

/* eslint-disable @typescript-eslint/no-explicit-any */

const KINDS: Record<string, { table: string; fk: string; target: string; label: string }> = {
  event: { table: "event_reviews", fk: "event_id", target: "events", label: "Events" },
  vendor: { table: "vendor_reviews", fk: "vendor_id", target: "vendors", label: "Vendors" },
  venue: { table: "venue_reviews", fk: "venue_id", target: "venues", label: "Venues" },
};

export default async function ReviewsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { admin } = await requireAdmin();
  const kind = first(searchParams.kind) in KINDS ? first(searchParams.kind) : "event";
  const status = ["published", "hidden"].includes(first(searchParams.status)) ? first(searchParams.status) : "";
  const page = pageParam(searchParams.page);
  const k = KINDS[kind];

  let query = admin.from(k.table).select("*", { count: "exact" });
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as any[];

  // Resolve reviewer + target names in two batched lookups.
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const targetIds = [...new Set(rows.map((r) => r[k.fk]))];
  const [{ data: profs }, { data: targets }] = await Promise.all([
    userIds.length ? admin.from("profiles").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] as any[] }),
    targetIds.length ? admin.from(k.target).select("*").in("id", targetIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  const targetMap = new Map((targets ?? []).map((t: any) => [t.id, t]));

  const tab = (key: string) =>
    cn("rounded-pill px-4 py-1.5 text-sm", key === kind ? "bg-purple-700 text-warmwhite" : "bg-white text-charcoal-600 hover:bg-purple-50 border border-border");

  return (
    <div>
      <PageHeader title="Reviews" description="Moderate customer reviews. Hidden reviews disappear from the public site and from rating averages." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {Object.entries(KINDS).map(([key, v]) => (
          <Link key={key} href={`/admin/reviews?kind=${key}`} className={tab(key)}>{v.label}</Link>
        ))}
        <span className="mx-2 h-5 w-px bg-border" />
        {[["", "All"], ["published", "Published"], ["hidden", "Hidden"]].map(([val, label]) => (
          <Link key={val} href={`/admin/reviews?kind=${kind}${val ? `&status=${val}` : ""}`}
            className={cn("rounded-pill px-3 py-1 text-xs", status === val ? "bg-gold-400/30 text-charcoal" : "text-charcoal-400 hover:text-purple-700")}>
            {label}
          </Link>
        ))}
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t load reviews: {error.message}</p>}

      {rows.length === 0 && !error ? (
        <EmptyState title="No reviews" description="Nothing to moderate here." />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const reviewer: any = profMap.get(r.user_id);
            const target: any = targetMap.get(r[k.fk]);
            const hidden = r.status === "hidden";
            return (
              <li key={r.id} className="rounded-card border border-border bg-white p-5 shadow-softer">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {"★".repeat(r.rating)}<span className="text-charcoal/20">{"★".repeat(5 - r.rating)}</span>
                      {r.title ? <span className="ml-2">{r.title}</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-charcoal-400">
                      {reviewer?.full_name || reviewer?.email || "Unknown user"} on{" "}
                      <span className="font-medium text-charcoal-600">{target?.title || target?.name || "(deleted)"}</span> · {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge value={r.status ?? "published"} />
                </div>
                {r.comment && <p className="mt-3 whitespace-pre-wrap text-sm text-charcoal-600">{r.comment}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={setReviewStatus.bind(null, kind, r.id, hidden ? "published" : "hidden")}>
                    <Button type="submit" size="sm" variant="secondary">{hidden ? "Publish" : "Hide"}</Button>
                  </form>
                  <ConfirmButton action={deleteReview.bind(null, kind, r.id)} message="Delete this review permanently?">Delete</ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pager page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/admin/reviews" params={{ kind, ...(status ? { status } : {}) }} />
    </div>
  );
}

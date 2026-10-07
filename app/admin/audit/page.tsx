import { requireAdmin } from "@/lib/admin/auth";
import { PAGE_SIZE, formatDateTime, pageParam } from "@/lib/admin/format";
import { PageHeader, Pager } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export const metadata = { title: "Audit log" };

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { admin } = await requireAdmin();
  const page = pageParam(searchParams.page);
  const { data, count, error } = await admin
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as any[];

  return (
    <div>
      <PageHeader title="Audit log" description="Every change made from the admin panel — who did what, and when." />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t load the log: {error.message}</p>}
      {rows.length === 0 && !error ? (
        <EmptyState title="Nothing logged yet" description="Admin actions will appear here." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>When</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Item</TableHead><TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.created_at)}</TableCell>
                  <TableCell>{r.admin_email ?? "—"}</TableCell>
                  <TableCell>{String(r.action).replace(/_/g, " ")}</TableCell>
                  <TableCell><code className="text-xs">{r.entity}{r.entity_id ? ` · ${String(r.entity_id).slice(0, 8)}` : ""}</code></TableCell>
                  <TableCell><code className="block max-w-xs truncate text-xs text-charcoal-400" title={r.details ? JSON.stringify(r.details) : ""}>{r.details ? JSON.stringify(r.details) : "—"}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/admin/audit" params={{}} />
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { fillHref, getResource } from "@/lib/admin/resources";
import { PAGE_SIZE, first, formatDate, formatDateTime, formatMoney, pageParam, pick, safeSearch } from "@/lib/admin/format";
import type { ListColumn, Resource } from "@/lib/admin/types";
import { toggleBoolean } from "@/app/admin/actions";
import { FilterBar, PageHeader, Pager, StatusBadge } from "@/components/admin/ui";
import { ToggleSwitch } from "@/components/admin/ToggleSwitch";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({ params }: { params: { resource: string } }) {
  return { title: getResource(params.resource)?.label ?? "Admin" };
}

function Cell({ col, row, res }: { col: ListColumn; row: any; res: Resource }) {
  const v = pick(row, col.name);

  switch (col.kind) {
    case "badge":
      return <StatusBadge value={v} />;
    case "money":
      return <>{formatMoney(v, row.currency)}</>;
    case "date":
      return <>{formatDate(v)}</>;
    case "datetime":
      return <>{formatDateTime(v)}</>;
    case "mono":
      return <code className="text-xs text-charcoal-600">{v ? String(v) : "—"}</code>;
    case "stars":
      return <>{Number(row.rating_count) > 0 ? `★ ${Number(v).toFixed(1)} (${row.rating_count})` : "—"}</>;
    case "bool":
      return col.toggle ? (
        <ToggleSwitch checked={!!v} label={col.label} action={toggleBoolean.bind(null, res.key, row.id, col.name)} />
      ) : (
        <>{v ? "Yes" : "No"}</>
      );
    default: {
      const text = Array.isArray(v) ? v.join(", ") : v === null || v === undefined || v === "" ? "—" : String(v);
      return <span className="block max-w-xs truncate" title={text}>{text}</span>;
    }
  }
}

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: { resource: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { admin } = await requireAdmin();
  const res = getResource(params.resource);
  if (!res) notFound();

  const q = safeSearch(first(searchParams.q));
  const page = pageParam(searchParams.page);

  let query = admin.from(res.table).select(res.select ?? "*", { count: "exact" });
  const current: Record<string, string> = {};
  for (const f of res.filters ?? []) {
    const v = first(searchParams[f.name]);
    if (v && f.options.some((o) => o.value === v)) {
      query = query.eq(f.name, v);
      current[f.name] = v;
    }
  }
  if (q) query = query.or(res.searchFields.map((f) => `${f}.ilike.%${q}%`).join(","));
  query = query
    .order(res.order.column, { ascending: res.order.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  const rows = (data ?? []) as any[];

  const rowHref = (row: any) =>
    res.detailHref ? fillHref(res.detailHref, row) : res.fields.length ? `/admin/${res.key}/${row.id}` : null;

  return (
    <div>
      <PageHeader
        title={res.label}
        description={res.description}
        actions={
          res.canCreate ? (
            <Link href={`/admin/${res.key}/new`}>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New {res.singular}</Button>
            </Link>
          ) : undefined
        }
      />

      <FilterBar q={q} placeholder={`Search ${res.label.toLowerCase()}…`} filters={res.filters} current={current} />

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t load data: {error.message}</p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState title={`No ${res.label.toLowerCase()} found`} description={q || Object.keys(current).length ? "Try clearing the search or filters." : `Nothing here yet.`} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {res.list.map((c) => (
                  <TableHead key={c.name}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const href = rowHref(row);
                return (
                  <TableRow key={row.id}>
                    {res.list.map((c, i) => (
                      <TableCell key={c.name} className={i === 0 ? "font-medium" : undefined}>
                        {i === 0 && href && !c.toggle ? (
                          <Link href={href} className="hover:text-purple-700 hover:underline">
                            <Cell col={c} row={row} res={res} />
                          </Link>
                        ) : (
                          <Cell col={c} row={row} res={res} />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {href && (
                        <Link href={href} className="text-sm font-medium text-purple-700 hover:underline">
                          {res.fields.length || res.detailHref ? (res.canCreate || res.fields.some((f) => f.type !== "readonly") ? "Edit" : "View") : "View"}
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pager page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={`/admin/${res.key}`} params={{ q, ...current }} />
        </>
      )}
    </div>
  );
}

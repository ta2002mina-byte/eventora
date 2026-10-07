import { Plus } from "lucide-react";
import { deleteChild, saveChild } from "@/app/admin/actions";
import { formatMoney, humanize } from "@/lib/admin/format";
import type { ChildResource, Field, Resource } from "@/lib/admin/types";
import { AdminForm } from "@/components/admin/AdminForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Panel } from "@/components/admin/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

function summaryText(key: string, row: any): string {
  const v = row[key];
  if (v === null || v === undefined || v === "") return "";
  if (key === "price") return formatMoney(v);
  if (typeof v === "boolean") return v ? humanize(key.replace(/^is_/, "")) : `Not ${key.replace(/^is_/, "")}`;
  if (key === "quantity_sold") return `${v} sold`;
  if (key === "quantity_total") return `of ${v}`;
  if (key.endsWith("_time")) return String(v).slice(0, 5);
  return String(v);
}

export function ChildSection({
  parent,
  child,
  parentId,
  rows,
  fields,
}: {
  parent: Resource;
  child: ChildResource;
  parentId: string;
  rows: any[];
  fields: Field[];
}) {
  return (
    <Panel title={child.label} description={`${rows.length} ${rows.length === 1 ? child.singular : child.singular + "s"}`}>
      <div className="space-y-2">
        {rows.map((row) => {
          const title = row[child.titleField] || `(untitled ${child.singular})`;
          const summary = child.summary.map((k) => summaryText(k, row)).filter(Boolean).join(" · ");
          return (
            <details key={row.id} className="group rounded-xl border border-border bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm marker:hidden hover:bg-purple-50/40">
                <span className="min-w-0 truncate font-medium">{title}</span>
                <span className="shrink-0 text-xs text-charcoal-400">{summary}</span>
              </summary>
              <div className="border-t border-border p-4">
                <AdminForm
                  fields={fields}
                  values={row}
                  action={saveChild.bind(null, parent.key, parentId, child.key, row.id)}
                />
                <div className="mt-3 border-t border-border pt-3">
                  <ConfirmButton
                    action={deleteChild.bind(null, parent.key, parentId, child.key, row.id)}
                    message={`Delete this ${child.singular}? This can't be undone.`}
                  >
                    Delete {child.singular}
                  </ConfirmButton>
                </div>
              </div>
            </details>
          );
        })}

        <details className="rounded-xl border border-dashed border-purple-300 bg-purple-50/30">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-purple-700 marker:hidden">
            <Plus className="h-4 w-4" /> Add {child.singular}
          </summary>
          <div className="border-t border-border p-4">
            <AdminForm
              fields={fields}
              values={{}}
              resetOnSuccess
              submitLabel={`Add ${child.singular}`}
              action={saveChild.bind(null, parent.key, parentId, child.key, null)}
            />
          </div>
        </details>
      </div>
    </Panel>
  );
}

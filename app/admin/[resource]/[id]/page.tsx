import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveOptions } from "@/lib/admin/options";
import { fillHref, getResource } from "@/lib/admin/resources";
import { deleteResource, saveResource } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { ChildSection } from "@/components/admin/ChildSection";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PageHeader, Panel } from "@/components/admin/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const metadata = { title: "Edit" };

export default async function EditResourcePage({
  params,
  searchParams,
}: {
  params: { resource: string; id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { admin } = await requireAdmin();
  const res = getResource(params.resource);
  if (!res || res.fields.length === 0) notFound();

  const { data: row } = await admin.from(res.table).select("*").eq("id", params.id).maybeSingle();
  if (!row) notFound();

  const values: Record<string, unknown> = { ...row };
  for (const f of res.fields) {
    if (f.type === "owner" && f.column && row[f.column]) {
      const { data: p } = await admin.from("profiles").select("email").eq("id", row[f.column]).maybeSingle();
      values[f.name] = p?.email ?? "";
    }
  }

  const fields = await resolveOptions(admin, res.fields);
  const title = String(row[res.titleField] ?? res.singular);
  const publicHref = res.publicHref && row.slug ? fillHref(res.publicHref, row) : null;
  const editable = fields.some((f) => f.type !== "readonly" && f.type !== "heading");

  const children = await Promise.all(
    (res.children ?? []).map(async (child) => {
      const { data } = await admin
        .from(child.table)
        .select("*")
        .eq(child.fk, params.id)
        .order(child.order.column, { ascending: child.order.ascending });
      return { child, rows: (data ?? []) as any[], fields: await resolveOptions(admin, child.fields) };
    })
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={title}
        backHref={`/admin/${res.key}`}
        backLabel={res.label}
        actions={
          publicHref ? (
            <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline">
              View on site <ExternalLink className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />

      {searchParams.created && (
        <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Created. {res.children?.length ? `You can now add ${res.children.map((c) => c.label.toLowerCase()).join(", ")} below.` : ""}
        </p>
      )}
      {searchParams.error === "has-orders" && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          This event has ticket orders, so it can&apos;t be deleted (that would erase the orders, payments and tickets).
          Set its status to <strong>Cancelled</strong> instead.
        </p>
      )}

      <div className="space-y-6">
        <Panel>
          <AdminForm
            fields={fields}
            values={values}
            action={saveResource.bind(null, res.key, params.id)}
            cancelHref={`/admin/${res.key}`}
            submitLabel={editable ? "Save changes" : "Close"}
          />
        </Panel>

        {children.map(({ child, rows, fields: cf }) => (
          <ChildSection key={child.key} parent={res} child={child} parentId={params.id} rows={rows} fields={cf} />
        ))}

        {res.canDelete && (
          <Panel title="Danger zone" className="border-red-200">
            <p className="mb-3 text-sm text-charcoal-400">
              Permanently delete this {res.singular}
              {res.children?.length ? ` and all of its ${res.children.map((c) => c.label.toLowerCase()).join(", ")}` : ""}. This can&apos;t be undone.
            </p>
            <ConfirmButton
              action={deleteResource.bind(null, res.key, params.id)}
              message={`Delete "${title}" permanently? This can't be undone.`}
            >
              Delete {res.singular}
            </ConfirmButton>
          </Panel>
        )}
      </div>
    </div>
  );
}

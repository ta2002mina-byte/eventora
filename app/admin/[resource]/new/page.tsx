import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { resolveOptions } from "@/lib/admin/options";
import { getResource } from "@/lib/admin/resources";
import { saveResource } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export async function generateMetadata({ params }: { params: { resource: string } }) {
  const res = getResource(params.resource);
  return { title: res ? `New ${res.singular}` : "Admin" };
}

export default async function NewResourcePage({ params }: { params: { resource: string } }) {
  const { admin } = await requireAdmin();
  const res = getResource(params.resource);
  if (!res || !res.canCreate) notFound();

  const fields = await resolveOptions(admin, res.fields);

  return (
    <div className="max-w-4xl">
      <PageHeader title={`New ${res.singular}`} backHref={`/admin/${res.key}`} backLabel={res.label} />
      <Panel>
        <AdminForm
          fields={fields}
          action={saveResource.bind(null, res.key, null)}
          submitLabel={`Create ${res.singular}`}
          cancelHref={`/admin/${res.key}`}
        />
      </Panel>
      {res.children?.length ? (
        <p className="mt-4 text-sm text-charcoal-400">
          After you create it you can add {res.children.map((c) => c.label.toLowerCase()).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

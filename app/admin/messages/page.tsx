import { requireAdmin } from "@/lib/admin/auth";
import { PAGE_SIZE, first, formatDateTime, pageParam, safeSearch } from "@/lib/admin/format";
import { FilterBar, PageHeader, Pager, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteMessage, saveMessageNotes, setMessageStatus } from "./actions";

export const metadata = { title: "Contact inbox" };

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_OPTIONS = ["new", "read", "replied", "archived"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

export default async function MessagesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { admin } = await requireAdmin();
  const q = safeSearch(first(searchParams.q));
  const page = pageParam(searchParams.page);
  const status = first(searchParams.status);
  const current: Record<string, string> = {};

  let query = admin.from("contact_messages").select("*", { count: "exact" });
  if (STATUS_OPTIONS.some((o) => o.value === status)) {
    query = query.eq("status", status);
    current.status = status;
  }
  if (q) query = query.or(["full_name", "email", "subject", "message"].map((f) => `${f}.ilike.%${q}%`).join(","));
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as any[];

  return (
    <div>
      <PageHeader title="Contact inbox" description="Messages sent from the public Contact page. Mark them read/replied, add private notes, or archive." />
      <FilterBar q={q} placeholder="Search messages…" filters={[{ name: "status", label: "Status", options: STATUS_OPTIONS }]} current={current} />
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Couldn&apos;t load messages: {error.message}</p>}

      {rows.length === 0 && !error ? (
        <EmptyState title="No messages" description="Nothing matches these filters yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <details key={m.id} className="group rounded-card border border-border bg-white shadow-softer">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.subject}</span>
                  <span className="block truncate text-xs text-charcoal-400">{m.full_name} · {m.email} · {formatDateTime(m.created_at)}</span>
                </span>
                <StatusBadge value={m.status ?? "new"} />
              </summary>
              <div className="space-y-4 border-t border-border px-5 py-4">
                <p className="whitespace-pre-wrap text-sm text-charcoal-600">{m.message}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                    <Button type="button" size="sm">Reply by email</Button>
                  </a>
                  {STATUS_OPTIONS.filter((o) => o.value !== (m.status ?? "new")).map((o) => (
                    <form key={o.value} action={setMessageStatus.bind(null, m.id, o.value)}>
                      <Button type="submit" size="sm" variant="secondary">Mark {o.label.toLowerCase()}</Button>
                    </form>
                  ))}
                  <ConfirmButton action={deleteMessage.bind(null, m.id)} message="Delete this message permanently?">Delete</ConfirmButton>
                </div>

                <form action={saveMessageNotes.bind(null, m.id)} className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`notes-${m.id}`}>Private notes</label>
                  <textarea id={`notes-${m.id}`} name="admin_notes" defaultValue={m.admin_notes ?? ""} rows={2} maxLength={2000}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-purple-700 focus:outline-none" />
                  <Button type="submit" size="sm" variant="secondary">Save notes</Button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
      <Pager page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/admin/messages" params={{ q, ...current }} />
    </div>
  );
}

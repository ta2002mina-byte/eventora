import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { Panel, PageHeader, StatCard, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function AdminDashboardPage() {
  const { admin } = await requireAdmin();

  const count = async (table: string, filter?: (q: any) => any) => {
    let q = admin.from(table).select("id", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [
    users, events, venues, vendors, orders, tickets,
    draftEvents, draftVenues, draftVendors, pendingOrders, newMessages,
  ] = await Promise.all([
    count("profiles"),
    count("events", (q) => q.eq("status", "published")),
    count("venues", (q) => q.eq("status", "published")),
    count("vendors", (q) => q.eq("status", "published")),
    count("bookings"),
    count("tickets"),
    count("events", (q) => q.eq("status", "draft")),
    count("venues", (q) => q.eq("status", "draft")),
    count("vendors", (q) => q.eq("status", "draft")),
    count("bookings", (q) => q.eq("status", "pending")),
    count("contact_messages", (q) => q.eq("status", "new")),
  ]);

  const [{ data: paid }, { data: recentOrders }, { data: recentMessages }, { data: recentUsers }, migration] = await Promise.all([
    admin.from("payments").select("amount").eq("status", "paid").limit(10000),
    admin.from("bookings").select("id, customer_name, subtotal, currency, status, created_at, events(title)").order("created_at", { ascending: false }).limit(6),
    admin.from("contact_messages").select("id, full_name, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
    admin.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
    admin.from("site_settings").select("key").limit(1),
  ]);

  const revenue = ((paid ?? []) as { amount: number }[]).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const needsAttention = [
    { label: "Draft events", n: draftEvents, href: "/admin/events?status=draft" },
    { label: "Draft venues", n: draftVenues, href: "/admin/venues?status=draft" },
    { label: "Draft vendors", n: draftVendors, href: "/admin/vendors?status=draft" },
    { label: "Pending ticket orders", n: pendingOrders, href: "/admin/bookings?status=pending" },
    { label: "New contact messages", n: newMessages, href: "/admin/messages?status=new" },
  ].filter((x) => x.n > 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="A live overview of everything on the platform." />

      {migration.error && (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The admin database changes aren&apos;t applied yet. Run{" "}
            <code className="rounded bg-white px-1.5 py-0.5">supabase/migrations/0011_admin_panel.sql</code> in the
            Supabase SQL editor — settings, testimonials, featured flags and the audit log depend on it.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.toLocaleString("en-US")} href="/admin/users" />
        <StatCard label="Published events" value={events.toLocaleString("en-US")} href="/admin/events" />
        <StatCard label="Published venues" value={venues.toLocaleString("en-US")} href="/admin/venues" />
        <StatCard label="Published vendors" value={vendors.toLocaleString("en-US")} href="/admin/vendors" />
        <StatCard label="Ticket orders" value={orders.toLocaleString("en-US")} href="/admin/bookings" />
        <StatCard label="Tickets issued" value={tickets.toLocaleString("en-US")} href="/admin/tickets" />
        <StatCard label="Paid revenue" value={formatMoney(revenue)} hint="Sum of paid payments" href="/admin/payments?status=paid" />
        <StatCard label="Unread messages" value={newMessages.toLocaleString("en-US")} href="/admin/messages?status=new" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Needs attention">
          {needsAttention.length === 0 ? (
            <p className="text-sm text-charcoal-400">All clear — nothing is waiting on you.</p>
          ) : (
            <ul className="divide-y divide-border">
              {needsAttention.map((x) => (
                <li key={x.label}>
                  <Link href={x.href} className="flex items-center justify-between py-2.5 text-sm hover:text-purple-700">
                    <span>{x.label}</span>
                    <span className="rounded-pill bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">{x.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Latest ticket orders">
          {(recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-charcoal-400">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(recentOrders as any[]).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/bookings/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-purple-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{o.customer_name}</span>
                      <span className="block truncate text-xs text-charcoal-400">
                        {(Array.isArray(o.events) ? o.events[0]?.title : o.events?.title) ?? "Event"} · {formatDateTime(o.created_at)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span>{formatMoney(o.subtotal, o.currency)}</span>
                      <StatusBadge value={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Latest contact messages">
          {(recentMessages ?? []).length === 0 ? (
            <p className="text-sm text-charcoal-400">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(recentMessages as any[]).map((m) => (
                <li key={m.id}>
                  <Link href="/admin/messages" className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-purple-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.subject}</span>
                      <span className="block truncate text-xs text-charcoal-400">
                        {m.full_name} · {formatDateTime(m.created_at)}
                      </span>
                    </span>
                    <StatusBadge value={m.status ?? "new"} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Newest users">
          <ul className="divide-y divide-border">
            {((recentUsers ?? []) as any[]).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{u.full_name || u.email}</span>
                  <span className="block truncate text-xs text-charcoal-400">{u.email} · {formatDateTime(u.created_at)}</span>
                </span>
                <StatusBadge value={u.role ?? "customer"} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

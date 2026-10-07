import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDateTime, formatMoney } from "@/lib/admin/format";
import { cancelBooking, completeBooking, markBookingPaid } from "@/app/admin/bookings/actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const metadata = { title: "Ticket order" };

const FLASH: Record<string, { tone: "ok" | "err"; text: string }> = {
  paid: { tone: "ok", text: "Order marked as paid and tickets issued." },
  cancelled: { tone: "ok", text: "Order cancelled, tickets cancelled and inventory released." },
  refunded: { tone: "ok", text: "Order cancelled and the payment marked refunded. Remember to send the money back through your gateway." },
  completed: { tone: "ok", text: "Order marked as completed." },
  cancelled_err: { tone: "err", text: "A cancelled order can't be marked paid — the customer should place a new order." },
  "already-paid": { tone: "err", text: "This order already has a paid payment." },
  "already-cancelled": { tone: "err", text: "This order is already cancelled." },
  "sold-out": { tone: "err", text: "Not enough ticket inventory left to confirm this order." },
  "not-confirmed": { tone: "err", text: "Only confirmed orders can be completed." },
  failed: { tone: "err", text: "Something went wrong. Please try again." },
};

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-charcoal">{value || "—"}</dd>
    </div>
  );
}

export default async function AdminBookingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const { admin } = await requireAdmin();

  const { data: booking } = await admin
    .from("bookings")
    .select("*, events(id, title, slug), ticket_items(*)")
    .eq("id", params.id)
    .maybeSingle();
  if (!booking) notFound();

  const [{ data: payments }, { data: tickets }] = await Promise.all([
    admin.from("payments").select("*").eq("booking_id", params.id).order("created_at", { ascending: false }),
    admin.from("tickets").select("*").eq("booking_id", params.id).order("issued_at", { ascending: true }),
  ]);

  const event = Array.isArray(booking.events) ? booking.events[0] : booking.events;
  const items = (booking.ticket_items ?? []) as any[];
  const hasPaid = ((payments ?? []) as any[]).some((p) => p.status === "paid");
  const flashKey = searchParams.done ?? (searchParams.error === "cancelled" ? "cancelled_err" : searchParams.error);
  const flash = flashKey ? FLASH[flashKey] : undefined;
  const cancelled = booking.status === "cancelled";

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={`Order · ${booking.customer_name}`}
        description={`Placed ${formatDateTime(booking.created_at)}`}
        backHref="/admin/bookings"
        backLabel="Ticket orders"
        actions={<StatusBadge value={booking.status} />}
      />

      {flash && (
        <p
          role={flash.tone === "err" ? "alert" : "status"}
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${flash.tone === "err" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
        >
          {flash.text}
        </p>
      )}

      <div className="space-y-6">
        <Panel title="Order details">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Customer" value={booking.customer_name} />
            <Info label="Email" value={<a href={`mailto:${booking.customer_email}`} className="text-purple-700 hover:underline">{booking.customer_email}</a>} />
            <Info label="Phone" value={booking.customer_phone} />
            <Info
              label="Event"
              value={event ? <Link href={`/admin/events/${event.id}`} className="text-purple-700 hover:underline">{event.title}</Link> : null}
            />
            <Info label="Total" value={formatMoney(booking.subtotal, booking.currency)} />
            <Info label="Order ID" value={<code className="text-xs">{booking.id}</code>} />
            {booking.notes && <Info label="Customer notes" value={booking.notes} />}
          </dl>
        </Panel>

        <Panel title="Actions" description="Changes apply immediately and are recorded in the audit log.">
          <div className="flex flex-wrap gap-3">
            {!cancelled && !hasPaid && (
              <ConfirmButton
                variant="primary"
                size="md"
                action={markBookingPaid.bind(null, booking.id)}
                message="Mark this order as paid and issue its tickets?"
              >
                Mark paid &amp; issue tickets
              </ConfirmButton>
            )}
            {booking.status === "confirmed" && (
              <ConfirmButton variant="outline" size="md" action={completeBooking.bind(null, booking.id)} message="Mark this order as completed?">
                Mark completed
              </ConfirmButton>
            )}
            {!cancelled && (
              <>
                <ConfirmButton
                  variant="outline"
                  size="md"
                  action={cancelBooking.bind(null, booking.id, false)}
                  message="Cancel this order? Its tickets are cancelled and the reserved inventory is released."
                >
                  Cancel order
                </ConfirmButton>
                {hasPaid && (
                  <ConfirmButton
                    size="md"
                    action={cancelBooking.bind(null, booking.id, true)}
                    message="Cancel this order AND mark its payment as refunded? You must return the money through your payment gateway yourself."
                  >
                    Cancel &amp; mark refunded
                  </ConfirmButton>
                )}
              </>
            )}
            {cancelled && <p className="text-sm text-charcoal-400">This order is cancelled — no further actions.</p>}
          </div>
        </Panel>

        <Panel title="Items">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Ticket</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>{formatMoney(i.unit_price, booking.currency)}</TableCell>
                  <TableCell>{i.quantity}</TableCell>
                  <TableCell className="text-right">{formatMoney(i.subtotal, booking.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Payments">
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-charcoal-400">No payment attempts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>When</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((payments ?? []) as any[]).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(p.paid_at ?? p.created_at)}</TableCell>
                    <TableCell>{p.provider}</TableCell>
                    <TableCell><code className="text-xs">{p.provider_reference ?? "—"}</code></TableCell>
                    <TableCell>{formatMoney(p.amount, p.currency)}</TableCell>
                    <TableCell><StatusBadge value={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="Tickets" description="Open a ticket to mark it used (check-in) or cancel it.">
          {(tickets ?? []).length === 0 ? (
            <p className="text-sm text-charcoal-400">No tickets have been issued for this order.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Code</TableHead>
                  <TableHead>Holder</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((tickets ?? []) as any[]).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`/admin/tickets/${t.id}`} className="font-mono text-xs text-purple-700 hover:underline">
                        {t.ticket_code}
                      </Link>
                    </TableCell>
                    <TableCell>{t.holder_name}</TableCell>
                    <TableCell>{t.ticket_type_name}</TableCell>
                    <TableCell><StatusBadge value={t.status} /></TableCell>
                    <TableCell>{formatDateTime(t.checked_in_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}

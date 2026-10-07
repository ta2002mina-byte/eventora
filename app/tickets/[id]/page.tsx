import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/auth";
import { getUserTicketById } from "@/lib/data/booking";
import { renderTicketQrSvg } from "@/lib/qrcode";
import type { TicketStatus } from "@/types/booking";

interface PageProps {
  params: { id: string };
}

const statusVariant: Record<TicketStatus, "success" | "gray" | "danger"> = {
  valid: "success",
  used: "gray",
  cancelled: "danger",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Ticket" };
  const ticket = await getUserTicketById(params.id, user.id);
  return { title: ticket ? `Ticket — ${ticket.event.title}` : "Ticket" };
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(value: string | null) {
  if (!value) return null;
  const [h, m] = value.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default async function TicketDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to view this ticket.</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-medium text-purple-700 hover:underline">
          Sign In
        </Link>
      </main>
    );
  }

  const ticket = await getUserTicketById(params.id, user.id);
  if (!ticket) notFound();

  const qrSvg = await renderTicketQrSvg(ticket.ticket_code);
  const time = formatTime(ticket.event.start_time);

  return (
    <main className="container-page py-10 sm:py-14">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> My Tickets
      </Link>

      <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-card border border-border bg-white shadow-soft">
        <div className="bg-gradient-to-br from-purple-700 to-purple-900 p-6 text-warmwhite">
          <Badge variant="gold" className="w-fit">
            {ticket.ticket_type_name}
          </Badge>
          <h1 className="mt-3 text-xl font-medium">{ticket.event.title}</h1>
          <div className="mt-3 space-y-1.5 text-sm text-warmwhite/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatDate(ticket.event.start_date)}
            </span>
            {time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {time}
              </span>
            )}
            {(ticket.event.location_name || ticket.event.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {ticket.event.location_name ?? ticket.event.city}
              </span>
            )}
          </div>
        </div>

        <div className="relative p-6">
          <div
            aria-hidden="true"
            className="absolute -top-3 left-0 right-0 flex justify-between px-4"
          >
            <span className="h-6 w-6 rounded-full bg-warmwhite" />
            <span className="h-6 w-6 rounded-full bg-warmwhite" />
          </div>

          <div className="flex flex-col items-center border-b border-dashed border-border pb-6">
            <div
              className="h-40 w-40 [&>svg]:h-full [&>svg]:w-full"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-3 font-mono text-sm tracking-wider text-charcoal">{ticket.ticket_code}</p>
            <Badge variant={statusVariant[ticket.status]} className="mt-2">
              {ticket.status}
            </Badge>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-charcoal-400">
                <User className="h-3.5 w-3.5" /> Holder
              </span>
              <span className="text-charcoal">{ticket.holder_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-charcoal-400">Email</span>
              <span className="text-charcoal">{ticket.holder_email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-charcoal-400">Ticket ID</span>
              <span className="font-mono text-xs text-charcoal">{ticket.id}</span>
            </div>
          </div>

          {ticket.status !== "valid" && (
            <p className="mt-4 rounded-lg bg-lavender-100/60 p-3 text-center text-xs text-charcoal-400">
              {ticket.status === "used"
                ? "This ticket has already been checked in."
                : "This ticket has been cancelled."}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

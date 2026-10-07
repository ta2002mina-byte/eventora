export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type TicketStatus = "valid" | "used" | "cancelled";

export interface BookingRecord {
  id: string;
  user_id: string;
  event_id: string;
  status: BookingStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  notes: string | null;
  subtotal: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TicketItemRecord {
  id: string;
  booking_id: string;
  ticket_type_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_reference: string | null;
  card_last4: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface TicketRecord {
  id: string;
  booking_id: string;
  ticket_item_id: string;
  event_id: string;
  user_id: string;
  ticket_code: string;
  ticket_type_name: string;
  holder_name: string;
  holder_email: string;
  status: TicketStatus;
  issued_at: string;
  checked_in_at: string | null;
}

/** A booking together with its line items — what the booking/checkout
 * pages need to render an order summary. */
export interface BookingWithItems extends BookingRecord {
  ticket_items: TicketItemRecord[];
}

/** A ticket enriched with the event fields the tickets pages display. */
export interface TicketWithEvent extends TicketRecord {
  event: {
    id: string;
    title: string;
    slug: string;
    start_date: string;
    start_time: string | null;
    location_name: string | null;
    city: string | null;
    cover_image_url: string | null;
  };
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

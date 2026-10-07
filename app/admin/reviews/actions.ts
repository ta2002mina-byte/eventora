"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, logAudit } from "@/lib/admin/auth";

const TABLES: Record<string, string> = {
  event: "event_reviews",
  vendor: "vendor_reviews",
  venue: "venue_reviews",
};

export async function setReviewStatus(kind: string, id: string, status: "published" | "hidden", _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const table = TABLES[kind];
  if (!table || !["published", "hidden"].includes(status)) throw new Error("Invalid request");
  const { error } = await admin.from(table).update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, status === "hidden" ? "hide" : "publish", table, id);
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

export async function deleteReview(kind: string, id: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const table = TABLES[kind];
  if (!table) throw new Error("Invalid request");
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, "delete", table, id);
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

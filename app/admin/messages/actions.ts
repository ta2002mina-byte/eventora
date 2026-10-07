"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, logAudit } from "@/lib/admin/auth";

const STATUSES = ["new", "read", "replied", "archived"];

export async function setMessageStatus(id: string, status: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  const { error } = await admin
    .from("contact_messages")
    .update({ status, handled_at: status === "new" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, `status_${status}`, "contact_messages", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function saveMessageNotes(id: string, fd: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const notes = String(fd.get("admin_notes") ?? "").slice(0, 2000);
  const { error } = await admin.from("contact_messages").update({ admin_notes: notes || null }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, "notes", "contact_messages", id);
  revalidatePath("/admin/messages");
}

export async function deleteMessage(id: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const { error } = await admin.from("contact_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, "delete", "contact_messages", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

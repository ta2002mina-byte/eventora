"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin, logAudit } from "@/lib/admin/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROLES = ["customer", "vendor", "admin"];
// Suspension = Supabase Auth "ban" (blocks sign-in and token refresh) + a flag on the profile.
const BAN_FOREVER = "876000h";

export async function setUserRole(userId: string, fd: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const role = String(fd.get("role") ?? "");
  if (!ROLES.includes(role)) redirect("/admin/users?error=invalid");
  if (userId === user.id) redirect("/admin/users?error=self");

  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) redirect("/admin/users?error=failed");
  await logAudit(user, "set_role", "profiles", userId, { role });
  revalidatePath("/admin/users");
  redirect("/admin/users?done=role");
}

export async function setUserSuspended(userId: string, suspended: boolean, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  if (userId === user.id) redirect("/admin/users?error=self");

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? BAN_FOREVER : "none",
  });
  if (authError) redirect("/admin/users?error=failed");
  await admin.from("profiles").update({ is_suspended: suspended }).eq("id", userId);
  await logAudit(user, suspended ? "suspend" : "unsuspend", "profiles", userId);
  revalidatePath("/admin/users");
  redirect(`/admin/users?done=${suspended ? "suspended" : "unsuspended"}`);
}

export async function deleteUser(userId: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  if (userId === user.id) redirect("/admin/users?error=self");

  // Deleting an account cascades to their orders/payments/tickets — keep financial
  // history intact and push admins to suspend instead.
  const { count } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) > 0) redirect("/admin/users?error=has-orders");

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) redirect("/admin/users?error=failed");
  await logAudit(user, "delete", "profiles", userId);
  revalidatePath("/admin/users");
  redirect("/admin/users?done=deleted");
}

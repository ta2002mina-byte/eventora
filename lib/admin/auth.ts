import "server-only";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/** Comma-separated bootstrap list from ADMIN_EMAILS (lower-cased). */
function bootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Is this signed-in user an admin? Reads the role with the service-role
 * client (never trusts anything the browser sent). Accounts whose
 * *confirmed* email is listed in ADMIN_EMAILS are promoted to the admin
 * role automatically, so the very first admin needs no SQL.
 */
export async function isAdminUser(user: Pick<User, "id" | "email" | "email_confirmed_at"> | null): Promise<boolean> {
  if (!user) return false;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_suspended) return false;
  if (profile?.role === "admin") return true;

  const email = user.email?.toLowerCase();
  if (email && user.email_confirmed_at && bootstrapEmails().includes(email)) {
    await admin.from("profiles").update({ role: "admin" }).eq("id", user.id);
    return true;
  }
  return false;
}

/**
 * Guard for admin Server Components. EVERY admin page calls this (the
 * layout alone is not enough: layouts are not re-run on client-side
 * navigation, and these pages read data with the service role).
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");
  if (!(await isAdminUser(user))) notFound();

  return { user, admin: createAdminClient() };
}

/** Guard for Server Actions — throws instead of redirecting. */
export async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user))) {
    throw new Error("Not authorized");
  }
  return { user, admin: createAdminClient() };
}

/** Best-effort audit trail; never blocks or fails the real action. */
export async function logAudit(
  user: Pick<User, "id" | "email">,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      admin_email: user.email ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      details: details ?? null,
    });
  } catch (e) {
    console.error("logAudit:", e);
  }
}

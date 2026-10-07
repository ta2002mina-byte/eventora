"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin, logAudit } from "@/lib/admin/auth";
import { coerceFields, formSource } from "@/lib/admin/coerce";
import { resolveOptions } from "@/lib/admin/options";
import { getChild, getResource } from "@/lib/admin/resources";
import { SETTINGS_FIELDS } from "@/lib/admin/settings-config";
import { plainSlug } from "@/lib/admin/slug";
import type { Field, FormState } from "@/lib/admin/types";
import { SITE_SETTINGS_TAG } from "@/lib/site-settings";
import { SETTINGS_GROUPS, mergeGroup, type SettingsGroup } from "@/lib/site-settings-defaults";
import { slugify } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

const UPDATED_AT_TABLES = new Set([
  "events",
  "venues",
  "vendors",
  "bookings",
  "venue_bookings",
  "vendor_bookings",
  "vendor_services",
  "vendor_packages",
]);

const PUBLIC_PATHS: Record<string, string[]> = {
  events: ["/", "/events"],
  event_categories: ["/", "/events"],
  event_ticket_types: ["/", "/events"],
  event_schedules: ["/events"],
  venues: ["/", "/venues"],
  venue_images: ["/venues"],
  vendors: ["/", "/vendors"],
  vendor_services: ["/vendors"],
  vendor_packages: ["/vendors"],
  vendor_portfolio: ["/vendors"],
  testimonials: ["/"],
};

function revalidateFor(table: string) {
  for (const p of PUBLIC_PATHS[table] ?? []) revalidatePath(p);
  revalidatePath("/admin", "layout");
}

function dbError(message: string, code?: string): string {
  if (code === "23505") return "That value is already used by another record (check the slug).";
  if (code === "23503") return "This record is referenced by other data and can't be changed that way.";
  if (code === "23514") return "One of the values isn't allowed.";
  return message;
}

async function prepare(admin: any, fields: Field[], fd: FormData, mode: "create" | "update") {
  const resolved = await resolveOptions(admin, fields);
  const { payload, errors, owners } = coerceFields(resolved, formSource(fd), mode);

  for (const o of owners) {
    if (!o.email) {
      payload[o.column] = null;
      continue;
    }
    const { data } = await admin.from("profiles").select("id").eq("email", o.email).maybeSingle();
    if (!data) errors[o.name] = "No registered account uses that email";
    else payload[o.column] = data.id;
  }
  return { payload, errors };
}

const invalid = (errors: Record<string, string>): FormState => ({
  error: "Please fix the highlighted fields.",
  fieldErrors: errors,
});

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

export async function saveResource(
  resourceKey: string,
  id: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const { user, admin } = await assertAdmin();
  const res = getResource(resourceKey);
  if (!res || res.fields.length === 0) return { error: "Unknown resource." };
  const mode = id ? "update" : "create";
  if (mode === "create" && !res.canCreate) return { error: "Creating records here isn't allowed." };

  const { payload, errors } = await prepare(admin, res.fields, fd, mode);
  if (Object.keys(errors).length) return invalid(errors);

  if (res.slugFrom && res.fields.some((f) => f.name === "slug")) {
    const given = typeof payload.slug === "string" ? plainSlug(payload.slug) : "";
    if (given) payload.slug = given;
    else if (mode === "create") {
      const source = String(payload[res.slugFrom] ?? "");
      payload.slug = res.slugRandomSuffix ? slugify(source) : plainSlug(source) || slugify(source);
    } else delete payload.slug; // keep the existing URL
  }

  if (UPDATED_AT_TABLES.has(res.table)) payload.updated_at = new Date().toISOString();

  if (mode === "update" && res.table === "tickets" && payload.status === "used") {
    const { data: t } = await admin.from("tickets").select("checked_in_at").eq("id", id).maybeSingle();
    if (!t?.checked_in_at) payload.checked_in_at = new Date().toISOString();
  }

  if (mode === "create") {
    const { data, error } = await admin.from(res.table).insert(payload).select("id").single();
    if (error) return { error: dbError(error.message, error.code) };
    await afterSave(admin, res.table, data.id, payload);
    await logAudit(user, "create", res.table, data.id, { title: payload[res.titleField] });
    revalidateFor(res.table);
    redirect(`/admin/${res.key}/${data.id}?created=1`);
  }

  const { error } = await admin.from(res.table).update(payload).eq("id", id);
  if (error) return { error: dbError(error.message, error.code) };
  await afterSave(admin, res.table, id as string, payload);
  await logAudit(user, "update", res.table, id, { fields: Object.keys(payload) });
  revalidateFor(res.table);
  revalidatePath(`/admin/${res.key}/${id}`);
  return { ok: true, message: "Saved." };
}

async function afterSave(admin: any, table: string, id: string, payload: Record<string, unknown>) {
  // venues.amenities is a cache of venue_amenities (the source of truth) — keep both in step.
  if (table === "venues" && Array.isArray(payload.amenities)) {
    await admin.from("venue_amenities").delete().eq("venue_id", id);
    const rows = (payload.amenities as string[]).map((name) => ({ venue_id: id, name }));
    if (rows.length) await admin.from("venue_amenities").insert(rows);
  }
}

export async function deleteResource(resourceKey: string, id: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const res = getResource(resourceKey);
  if (!res || !res.canDelete) throw new Error("Deleting isn't allowed here.");

  // Deleting an event would cascade-delete its orders, payments and tickets.
  if (res.table === "events") {
    const { count } = await admin.from("bookings").select("id", { count: "exact", head: true }).eq("event_id", id);
    if ((count ?? 0) > 0) redirect(`/admin/events/${id}?error=has-orders`);
  }

  const { error } = await admin.from(res.table).delete().eq("id", id);
  if (error) throw new Error(dbError(error.message, error.code));
  await logAudit(user, "delete", res.table, id);
  revalidateFor(res.table);
  redirect(`/admin/${res.key}`);
}

export async function toggleBoolean(resourceKey: string, id: string, field: string, value: boolean): Promise<void> {
  const { user, admin } = await assertAdmin();
  const res = getResource(resourceKey);
  const f = res?.fields.find((x) => x.name === field && x.type === "boolean");
  if (!res || !f) throw new Error("Not allowed.");
  const patch: Record<string, unknown> = { [field]: !!value };
  if (UPDATED_AT_TABLES.has(res.table)) patch.updated_at = new Date().toISOString();
  const { error } = await admin.from(res.table).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(user, "toggle", res.table, id, { [field]: !!value });
  revalidateFor(res.table);
}

/* ------------------------------------------------------------------ */
/* Child records (ticket types, services, …)                           */
/* ------------------------------------------------------------------ */

async function syncParentAfterChild(admin: any, childTable: string, parentId: string) {
  if (childTable !== "event_ticket_types") return;
  const { data } = await admin
    .from("event_ticket_types")
    .select("price")
    .eq("event_id", parentId)
    .order("price", { ascending: true })
    .limit(1);
  // No ticket types left: leave the manually-set starting price alone.
  if (data && data.length) {
    await admin
      .from("events")
      .update({ starting_price: data[0].price, updated_at: new Date().toISOString() })
      .eq("id", parentId);
  }
}

export async function saveChild(
  parentKey: string,
  parentId: string,
  childKey: string,
  childId: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const { user, admin } = await assertAdmin();
  const parent = getResource(parentKey);
  const child = parent ? getChild(parent, childKey) : undefined;
  if (!parent || !child) return { error: "Unknown resource." };

  const mode = childId ? "update" : "create";
  const { payload, errors } = await prepare(admin, child.fields, fd, mode);
  if (Object.keys(errors).length) return invalid(errors);
  if (UPDATED_AT_TABLES.has(child.table)) payload.updated_at = new Date().toISOString();

  if (mode === "create") {
    payload[child.fk] = parentId;
    const { error } = await admin.from(child.table).insert(payload);
    if (error) return { error: dbError(error.message, error.code) };
  } else {
    const { error } = await admin.from(child.table).update(payload).eq("id", childId).eq(child.fk, parentId);
    if (error) return { error: dbError(error.message, error.code) };
  }

  await syncParentAfterChild(admin, child.table, parentId);
  await logAudit(user, mode, child.table, childId ?? parentId, { parent: parent.table, parentId });
  revalidateFor(child.table);
  revalidatePath(`/admin/${parent.key}/${parentId}`);
  return { ok: true, message: mode === "create" ? "Added." : "Saved." };
}

export async function deleteChild(
  parentKey: string,
  parentId: string,
  childKey: string,
  childId: string,
  _fd?: FormData
): Promise<void> {
  const { user, admin } = await assertAdmin();
  const parent = getResource(parentKey);
  const child = parent ? getChild(parent, childKey) : undefined;
  if (!parent || !child) throw new Error("Unknown resource.");

  const { error } = await admin.from(child.table).delete().eq("id", childId).eq(child.fk, parentId);
  if (error) throw new Error(dbError(error.message, error.code));
  await syncParentAfterChild(admin, child.table, parentId);
  await logAudit(user, "delete", child.table, childId, { parent: parent.table, parentId });
  revalidateFor(child.table);
  revalidatePath(`/admin/${parent.key}/${parentId}`);
}

/* ------------------------------------------------------------------ */
/* Site settings                                                       */
/* ------------------------------------------------------------------ */

function isGroup(g: string): g is SettingsGroup {
  return (SETTINGS_GROUPS as string[]).includes(g);
}

export async function saveSettings(group: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { user, admin } = await assertAdmin();
  if (!isGroup(group)) return { error: "Unknown settings group." };

  const { payload, errors } = coerceFields(SETTINGS_FIELDS[group], formSource(fd), "create");
  if (Object.keys(errors).length) return invalid(errors);

  const { data: row } = await admin.from("site_settings").select("value").eq("key", group).maybeSingle();
  const merged: Record<string, unknown> = { ...(mergeGroup(group, row?.value) as object), ...payload };
  for (const k of Object.keys(merged)) if (merged[k] === null) merged[k] = "";

  const { error } = await admin
    .from("site_settings")
    .upsert({ key: group, value: merged, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    return {
      error: /relation .* does not exist|site_settings/i.test(error.message)
        ? "The site_settings table is missing — run supabase/migrations/0011_admin_panel.sql first."
        : error.message,
    };
  }

  await logAudit(user, "update", "site_settings", group);
  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved — the site is updated." };
}

export async function resetSettings(group: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  if (!isGroup(group)) throw new Error("Unknown settings group.");
  await admin.from("site_settings").delete().eq("key", group);
  await logAudit(user, "reset", "site_settings", group);
  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/", "layout");
  redirect(`/admin/settings?tab=${group}&reset=1`);
}

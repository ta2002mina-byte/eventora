"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { VENDOR_CATEGORY_LABELS } from "@/types/vendor";
import type { VendorCategory } from "@/types/vendor";

interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidateVendorDashboard() {
  for (const path of [
    "/vendor/dashboard",
    "/vendor/dashboard/profile",
    "/vendor/dashboard/services",
    "/vendor/dashboard/packages",
    "/vendor/dashboard/bookings",
    "/vendor/dashboard/calendar",
    "/vendor/dashboard/customers",
    "/vendor/dashboard/earnings",
    "/vendor/dashboard/reviews",
    "/vendor/dashboard/settings",
  ]) {
    revalidatePath(path);
  }
}

async function requireOwnedVendorId(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ------------------------------------------------------------------
// Vendor onboarding + profile
// ------------------------------------------------------------------

const vendorProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Give your business a name").max(120),
  category: z.enum(Object.keys(VENDOR_CATEGORY_LABELS) as [VendorCategory, ...VendorCategory[]]),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  serviceArea: z.string().trim().max(400).optional().or(z.literal("")), // comma-separated
  startingPrice: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(8).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  contactEmail: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  logoUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;

/** Creates a new vendor profile for the signed-in user (onboarding). */
export async function createVendorProfile(input: VendorProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to create a vendor profile." };

  const existing = await requireOwnedVendorId(user.id);
  if (existing) return { ok: false, error: "You already have a vendor profile." };

  const parsed = vendorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const v = parsed.data;
  const supabase = createClient();

  const baseSlug = slugify(v.businessName) || "vendor";
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase.from("vendors").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = await supabase.from("vendors").insert({
    owner_id: user.id,
    business_name: v.businessName,
    slug,
    category: v.category,
    description: v.description || null,
    city: v.city || null,
    address: v.address || null,
    service_area: v.serviceArea
      ? v.serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    starting_price: v.startingPrice ?? 0,
    currency: v.currency || "BDT",
    years_experience: v.yearsExperience ?? 0,
    contact_email: v.contactEmail || user.email || null,
    contact_phone: v.contactPhone || null,
    logo_url: v.logoUrl || null,
    cover_image_url: v.coverImageUrl || null,
    status: "published",
    visibility: "public",
  });

  if (error) return { ok: false, error: error.message };
  revalidateVendorDashboard();
  return { ok: true };
}

/** Updates the signed-in user's existing vendor profile. */
export async function updateVendorProfile(input: VendorProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = vendorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const v = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from("vendors")
    .update({
      business_name: v.businessName,
      category: v.category,
      description: v.description || null,
      city: v.city || null,
      address: v.address || null,
      service_area: v.serviceArea
        ? v.serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      starting_price: v.startingPrice ?? 0,
      currency: v.currency || "BDT",
      years_experience: v.yearsExperience ?? 0,
      contact_email: v.contactEmail || null,
      contact_phone: v.contactPhone || null,
      logo_url: v.logoUrl || null,
      cover_image_url: v.coverImageUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidateVendorDashboard();
  revalidatePath("/vendors");
  return { ok: true };
}

/** Toggles the vendor's storefront visibility between published and draft. */
export async function setVendorStatus(status: "published" | "draft"): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", vendorId)
    .eq("owner_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidateVendorDashboard();
  revalidatePath("/vendors");
  return { ok: true };
}

// ------------------------------------------------------------------
// Portfolio
// ------------------------------------------------------------------

const portfolioSchema = z.object({
  projectName: z.string().trim().min(1, "Give the project a name").max(160),
  caption: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function addPortfolioItem(input: z.infer<typeof portfolioSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = createClient();
  const { count } = await supabase
    .from("vendor_portfolio")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { error } = await supabase.from("vendor_portfolio").insert({
    vendor_id: vendorId,
    project_name: parsed.data.projectName,
    caption: parsed.data.caption || null,
    image_url: parsed.data.imageUrl || null,
    sort_order: count ?? 0,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/profile");
  revalidatePath(`/vendors`);
  return { ok: true };
}

export async function deletePortfolioItem(itemId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_portfolio")
    .delete()
    .eq("id", itemId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/profile");
  return { ok: true };
}

// ------------------------------------------------------------------
// Services
// ------------------------------------------------------------------

const serviceSchema = z.object({
  serviceId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Name the service").max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price can't be negative"),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export async function saveVendorService(input: ServiceInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;
  const supabase = createClient();

  if (v.serviceId) {
    const { error } = await supabase
      .from("vendor_services")
      .update({
        name: v.name,
        description: v.description || null,
        price: v.price,
        unit: v.unit || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", v.serviceId)
      .eq("vendor_id", vendorId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("vendor_services").insert({
      vendor_id: vendorId,
      name: v.name,
      description: v.description || null,
      price: v.price,
      unit: v.unit || null,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/vendor/dashboard/services");
  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendorService(serviceId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_services")
    .delete()
    .eq("id", serviceId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/services");
  return { ok: true };
}

export async function toggleVendorServiceActive(
  serviceId: string,
  isActive: boolean
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_services")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/services");
  revalidatePath("/vendors");
  return { ok: true };
}

// ------------------------------------------------------------------
// Packages
// ------------------------------------------------------------------

const packageSchema = z.object({
  packageId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Name the package").max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price can't be negative"),
  duration: z.string().trim().max(80).optional().or(z.literal("")),
  includedServices: z.string().trim().max(1000).optional().or(z.literal("")), // one per line
  isPopular: z.boolean().default(false),
});

export type PackageInput = z.infer<typeof packageSchema>;

export async function saveVendorPackage(input: PackageInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;
  const includedServices = v.includedServices
    ? v.includedServices.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];
  const supabase = createClient();

  if (v.packageId) {
    const { error } = await supabase
      .from("vendor_packages")
      .update({
        name: v.name,
        description: v.description || null,
        price: v.price,
        duration: v.duration || null,
        included_services: includedServices,
        is_popular: v.isPopular,
        updated_at: new Date().toISOString(),
      })
      .eq("id", v.packageId)
      .eq("vendor_id", vendorId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("vendor_packages").insert({
      vendor_id: vendorId,
      name: v.name,
      description: v.description || null,
      price: v.price,
      duration: v.duration || null,
      included_services: includedServices,
      is_popular: v.isPopular,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/vendor/dashboard/packages");
  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendorPackage(packageId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_packages")
    .delete()
    .eq("id", packageId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/packages");
  return { ok: true };
}

export async function toggleVendorPackageActive(
  packageId: string,
  isActive: boolean
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_packages")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", packageId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/packages");
  revalidatePath("/vendors");
  return { ok: true };
}

// ------------------------------------------------------------------
// Bookings (accept / reject / cancel / complete)
// ------------------------------------------------------------------

const bookingStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["confirmed", "cancelled", "completed"]),
  amount: z.coerce.number().min(0).optional(),
});

export async function updateVendorBookingStatus(
  input: z.infer<typeof bookingStatusSchema>
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = bookingStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const { bookingId, status, amount } = parsed.data;

  const supabase = createClient();

  // Only pending requests can be accepted/rejected; only confirmed
  // bookings can be marked complete. Cancellation is allowed from
  // pending or confirmed.
  const { data: booking } = await supabase
    .from("vendor_bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Booking not found." };

  const allowedFrom: Record<string, string[]> = {
    confirmed: ["pending"],
    cancelled: ["pending", "confirmed"],
    completed: ["confirmed"],
  };
  if (!allowedFrom[status]?.includes(booking.status)) {
    return { ok: false, error: `Can't move a ${booking.status} booking to ${status}.` };
  }

  const { error } = await supabase
    .from("vendor_bookings")
    .update({
      status,
      amount: typeof amount === "number" ? amount : undefined,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/bookings");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/dashboard/earnings");
  revalidatePath("/vendor/dashboard/customers");
  return { ok: true };
}

export async function markVendorBookingPaid(bookingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vendor_bookings")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("vendor_id", vendorId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/earnings");
  revalidatePath("/vendor/dashboard/bookings");
  return { ok: true };
}

// ------------------------------------------------------------------
// Availability calendar
// ------------------------------------------------------------------

const availabilitySchema = z.object({
  date: z.string().min(1),
  status: z.enum(["available", "booked", "blocked"]),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function setVendorAvailability(
  input: z.infer<typeof availabilitySchema>
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const vendorId = await requireOwnedVendorId(user.id);
  if (!vendorId) return { ok: false, error: "No vendor profile found." };

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const { date, status, note } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from("vendor_availability")
    .upsert(
      { vendor_id: vendorId, date, status, note: note || null },
      { onConflict: "vendor_id,date" }
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendor/dashboard/calendar");
  revalidatePath("/vendors");
  return { ok: true };
}

import { isAdminUser } from "@/lib/admin/auth";
import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorBookings } from "@/lib/data/vendor-dashboard";
import { getUnreadMessageCount } from "@/lib/data/messaging";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VendorOnboardingForm } from "@/components/vendor-dashboard/VendorOnboardingForm";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-warmwhite px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-medium">Sign in to your vendor dashboard</h1>
        <p className="mt-2 max-w-sm text-sm text-charcoal-400">
          Manage your services, packages, bookings and earnings here. Sign in to continue.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </main>
    );
  }

  const vendor = await getVendorForOwner(user.id);

  if (!vendor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-warmwhite px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-medium">Set up your vendor profile</h1>
            <p className="mt-2 text-sm text-charcoal-400">
              Tell customers about your business. You can add services, packages and portfolio
              photos right after.
            </p>
          </div>
          <VendorOnboardingForm />
        </div>
      </main>
    );
  }

  const [pendingQuotes, unreadMessages] = await Promise.all([
    getVendorBookings(vendor.id, "pending"),
    getUnreadMessageCount(user.id),
  ]);
  const email = user.email ?? "Your account";

  return (
    <DashboardShell
      email={email}
      notificationCount={pendingQuotes.length}
      navBase="vendor"
      messageBadge={unreadMessages}
      defaultTitle="Vendor Dashboard"
      notificationsHref="/vendor/dashboard/bookings"
      isAdmin={await isAdminUser(user)}
      profileMenuLinks={{
        dashboardHref: "/vendor/dashboard",
        settingsHref: "/vendor/dashboard/settings",
      }}
    >
      {children}
    </DashboardShell>
  );
}

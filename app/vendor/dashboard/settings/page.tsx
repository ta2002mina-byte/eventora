import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Mail, ShieldCheck, User, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner } from "@/lib/data/vendor-dashboard";
import { signOut } from "@/app/dashboard/actions";
import { VendorVisibilityToggle } from "@/components/vendor-dashboard/VendorVisibilityToggle";

export const metadata: Metadata = { title: "Settings" };

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default async function VendorSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  const rows = [
    { icon: Mail, label: "Email", value: user.email ?? "—" },
    {
      icon: ShieldCheck,
      label: "Email verified",
      value: user.email_confirmed_at ? "Verified" : "Not verified",
    },
    { icon: User, label: "Member since", value: formatDate(user.created_at) },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Settings</h2>
        <p className="mt-1 text-sm text-charcoal-400">Manage your account and vendor storefront.</p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Storefront</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VendorVisibilityToggle status={vendor.status} />
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-charcoal-600">
              <Store className="h-4 w-4 text-purple-600" />
              Manage business details, services and packages from the sidebar.
            </div>
            <Link href="/vendor/dashboard/profile">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Edit profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
                  <row.icon className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-charcoal-400">{row.label}</dt>
                  <dd className="text-sm font-medium text-charcoal">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-charcoal-400">
            Sign out of Eventora on this device. You can sign back in anytime.
          </p>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="danger" leftIcon={<LogOut className="h-4 w-4" />}>
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

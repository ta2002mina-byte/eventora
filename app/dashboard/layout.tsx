import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin/auth";
import { getUnreadMessageCount } from "@/lib/data/messaging";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-warmwhite px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-medium">Sign in to your dashboard</h1>
        <p className="mt-2 max-w-sm text-sm text-charcoal-400">
          Your events, guests, budgets, bookings and saved items live here. Sign in to continue.
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

  const email = user.email ?? "Your account";
  const unreadMessages = await getUnreadMessageCount(user.id);

  return (
    <DashboardShell email={email} notificationCount={0} messageBadge={unreadMessages} isAdmin={await isAdminUser(user)}>
      {children}
    </DashboardShell>
  );
}

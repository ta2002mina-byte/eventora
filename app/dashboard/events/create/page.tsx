import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { EventCreateForm } from "@/components/planner/EventCreateForm";

export const metadata: Metadata = { title: "Create Event" };

export default async function CreateEventPage() {
  const user = await getCurrentUser();

  return (
    <main className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-2 text-purple-700">
          <CalendarPlus className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">New Event</span>
        </div>
        <h1 className="text-3xl font-medium">Create your event</h1>
        <p className="mt-2 text-charcoal-400">
          Start with the basics — you can refine budget, guests and tasks with the AI Planner
          right after.
        </p>

        <Card className="mt-8">
          <CardContent className="p-6">
            {user ? (
              <EventCreateForm />
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-charcoal-600">Sign in to create and manage your events.</p>
                <Link href="/auth/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

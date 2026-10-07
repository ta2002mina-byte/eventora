import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getUserEventById } from "@/lib/data/planner";
import { AiPlannerForm } from "@/components/planner/AiPlannerForm";
import { EventSectionNav } from "@/components/planner/EventSectionNav";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "AI Event Planner" };
  const event = await getUserEventById(params.id, user.id);
  return { title: event ? `${event.title} — AI Planner` : "AI Event Planner" };
}

export default async function EventAiPlannerPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to use the AI Planner for this event.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const event = await getUserEventById(params.id, user.id);
  if (!event) notFound();

  return (
    <main className="container-page py-10 sm:py-14">
      <Link
        href={`/dashboard/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> {event.title}
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <Badge variant="gold">
          <Sparkles className="h-3.5 w-3.5" /> AI Event Planner
        </Badge>
      </div>
      <h1 className="mt-2 text-3xl font-medium">Plan &ldquo;{event.title}&rdquo; with AI</h1>
      <p className="mt-2 max-w-2xl text-charcoal-400">
        Generate a budget, checklist, timeline and vendor/venue recommendations — then add them
        straight to this event.
      </p>

      <EventSectionNav eventId={event.id} active="ai-planner" className="mt-6" />

      <div className="mt-8 max-w-3xl">
        <AiPlannerForm
          eventId={event.id}
          isAuthenticated
          defaultValues={{
            eventType: event.event_type ?? "",
            location: event.city ?? "",
            guestCount: event.guest_count ?? undefined,
            budget: event.budget ?? undefined,
            eventDate: event.start_date ?? "",
            theme: event.theme ?? "",
          }}
        />
      </div>
    </main>
  );
}

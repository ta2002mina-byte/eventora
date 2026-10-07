import { Wrench } from "lucide-react";

export function MaintenanceScreen({ siteName, message }: { siteName: string; message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-warmwhite px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-warmwhite">
        <Wrench className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-3xl text-charcoal">{siteName} is taking a short break</h1>
      <p className="mt-3 max-w-md text-charcoal-400">{message}</p>
    </main>
  );
}

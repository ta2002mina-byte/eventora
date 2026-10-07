import { iconByName } from "@/lib/icons";
import type { SiteSettings } from "@/lib/site-settings-defaults";

export function PlanningFeatures({ home }: { home: SiteSettings["home"] }) {
  if (!home.features?.length) return null;
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="mb-10 max-w-lg">
          <h2 className="text-2xl sm:text-3xl">{home.features_title}</h2>
          {home.features_subtitle && <p className="mt-2 text-charcoal-400">{home.features_subtitle}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {home.features.map((f, i) => {
            const Icon = iconByName(f.icon);
            return (
              <div key={`${f.title}-${i}`} className="rounded-card border border-border p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-medium text-charcoal">{f.title}</h3>
                <p className="mt-1.5 text-sm text-charcoal-400">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

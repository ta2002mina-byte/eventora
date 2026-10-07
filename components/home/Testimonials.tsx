import { Quote } from "lucide-react";
import { getTestimonials } from "@/lib/data/home";

export async function Testimonials({ title }: { title: string }) {
  const items = await getTestimonials();
  if (items.length === 0) return null;
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="mb-10 max-w-lg">
          <h2 className="text-2xl sm:text-3xl">{title}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {items.map((t) => (
            <figure key={t.id} className="rounded-card border border-border p-6">
              <Quote className="h-5 w-5 text-gold-400" aria-hidden="true" />
              <blockquote className="mt-3 text-sm text-charcoal-600">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-medium text-charcoal">{t.author_name}</span>
                {t.author_role && <span className="text-charcoal-400"> — {t.author_role}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

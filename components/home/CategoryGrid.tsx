import Link from "next/link";
import { getHomeCategories } from "@/lib/data/home";
import { iconByName } from "@/lib/icons";

export async function CategoryGrid() {
  const categories = await getHomeCategories();
  if (categories.length === 0) return null;
  return (
    <section className="container-page py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl">Browse by occasion</h2>
          <p className="mt-2 text-charcoal-400">Start from the kind of event you&apos;re planning.</p>
        </div>
        <Link href="/events" className="hidden text-sm font-medium text-purple-700 hover:underline sm:block">
          View all events
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((cat) => {
          const Icon = iconByName(cat.icon);
          return (
            <Link
              key={cat.id}
              href={{ pathname: "/events", query: { category: cat.slug } }}
              className="group flex flex-col items-center gap-3 rounded-card border border-border bg-white p-5 text-center transition-shadow hover:shadow-soft"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender-100 text-purple-700 transition-colors group-hover:bg-purple-700 group-hover:text-warmwhite">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-charcoal">{cat.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

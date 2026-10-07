import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { humanize, statusVariant } from "@/lib/admin/format";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-sm text-charcoal-400 hover:text-purple-700">
          <ChevronLeft className="h-4 w-4" /> {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-charcoal-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-charcoal-400">—</span>;
  return <Badge variant={statusVariant(value)}>{humanize(value)}</Badge>;
}

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card border border-border bg-white p-5 shadow-softer sm:p-6", className)}>
      {title && <h3 className="text-lg font-medium text-charcoal">{title}</h3>}
      {description && <p className="mt-1 text-sm text-charcoal-400">{description}</p>}
      <div className={cn(title && "mt-4")}>{children}</div>
    </section>
  );
}

/** GET-based search + filter bar (works without client JS). */
export function FilterBar({
  q,
  placeholder = "Search…",
  filters = [],
  current,
  hidden = {},
}: {
  q: string;
  placeholder?: string;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  current: Record<string, string>;
  hidden?: Record<string, string>;
}) {
  return (
    <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative min-w-[14rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.name}
          name={f.name}
          defaultValue={current[f.name] ?? ""}
          aria-label={f.label}
          className="h-10 rounded-xl border border-border bg-white px-3 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">All {f.label.toLowerCase()}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <Button type="submit" size="sm" variant="outline">
        Apply
      </Button>
    </form>
  );
}

/** Server-rendered prev/next pager that preserves the other query params. */
export function Pager({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-charcoal-400">
      <p>
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total.toLocaleString("en-US")}`}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={href(page - 1)} className="inline-flex items-center gap-1 rounded-pill border border-border px-3 py-1.5 hover:bg-purple-50">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Link>
          ) : null}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className="inline-flex items-center gap-1 rounded-pill border border-border px-3 py-1.5 hover:bg-purple-50">
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <div className="rounded-card border border-border bg-white p-5 shadow-softer transition-shadow hover:shadow-soft">
      <p className="text-sm text-charcoal-400">{label}</p>
      <p className="mt-1 font-display text-3xl text-charcoal">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

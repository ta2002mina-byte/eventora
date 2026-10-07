import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-charcoal-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-medium text-charcoal">{value}</p>
      {hint && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-charcoal-400">
          {hint}
          {href && <ArrowRight className="h-3 w-3 text-purple-700" />}
        </span>
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Card hoverable className="transition-shadow">
        <Link href={href} className="block">
          {body}
        </Link>
      </Card>
    );
  }
  return <Card>{body}</Card>;
}

import Link from "next/link";
import { Sparkles, Instagram, Facebook, Linkedin } from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings-defaults";

export function Footer({
  siteName = "Eventora",
  description,
  contact,
  links,
}: {
  siteName?: string;
  links: SiteSettings["navigation"]["footer_links"];
  description: string;
  contact: SiteSettings["contact"];
}) {
  const columns: { heading: string; links: { href: string; label: string }[] }[] = [];
  for (const l of links) {
    let col = columns.find((c) => c.heading === l.column);
    if (!col) columns.push((col = { heading: l.column, links: [] }));
    col.links.push({ href: l.href, label: l.label });
  }
  const socials = [
    { href: contact.instagram, label: "Instagram", Icon: Instagram },
    { href: contact.facebook, label: "Facebook", Icon: Facebook },
    { href: contact.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-border bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-warmwhite">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-medium text-charcoal">{siteName}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-charcoal-400">
            {description}
          </p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${siteName} on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="text-sm font-medium text-charcoal">{col.heading}</h3>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-400 hover:text-purple-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border py-6">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-charcoal-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-purple-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-purple-700">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { SiteSettings } from "@/lib/site-settings-defaults";

/**
 * The marketing Header/Footer wrap every public page. Dashboard and admin
 * routes render their own app shell (sidebar + top bar), so we suppress the
 * marketing chrome there to avoid a duplicated, stacked navigation.
 */
export function SiteChrome({
  children,
  siteName,
  footerDescription,
  contact,
  navigation,
}: {
  children: React.ReactNode;
  siteName: string;
  footerDescription: string;
  contact: SiteSettings["contact"];
  navigation: SiteSettings["navigation"];
}) {
  const pathname = usePathname();
  const isAppShell = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  if (isAppShell) return <>{children}</>;

  return (
    <>
      <Header siteName={siteName} links={navigation.header_links} />
      {children}
      <Footer siteName={siteName} description={footerDescription} contact={contact} links={navigation.footer_links} />
    </>
  );
}

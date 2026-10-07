import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { headers } from "next/headers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MaintenanceScreen } from "@/components/layout/MaintenanceScreen";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin/auth";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventora.example.com";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSiteSettings();
  const title = general.tagline ? `${general.site_name} — ${general.tagline}` : general.site_name;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${general.site_name}` },
    description: general.seo_description,
    openGraph: {
      type: "website",
      siteName: general.site_name,
      title,
      description: general.seo_description,
      url: siteUrl,
    },
    twitter: { card: "summary_large_image", title, description: general.seo_description },
  };
}

const MAINTENANCE_EXEMPT = ["/admin", "/auth", "/api"];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const { general, contact, platform, navigation } = settings;

  let body: React.ReactNode = (
    <SiteChrome siteName={general.site_name} footerDescription={general.footer_description} contact={contact} navigation={navigation}>
      {children}
    </SiteChrome>
  );

  if (platform.maintenance_mode) {
    const path = headers().get("x-pathname") ?? "";
    const exempt = MAINTENANCE_EXEMPT.some((p) => path === p || path.startsWith(`${p}/`));
    if (!exempt && !(await isAdminUser(await getCurrentUser()))) {
      body = <MaintenanceScreen siteName={general.site_name} message={platform.maintenance_message} />;
    }
  }

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>{body}</ToastProvider>
      </body>
    </html>
  );
}

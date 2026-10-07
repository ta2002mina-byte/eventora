import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getSiteSettings();
  return { title: legal.terms_title };
}

export default async function TermsPage() {
  const { legal } = await getSiteSettings();
  return <LegalPage title={legal.terms_title} body={legal.terms_body} />;
}

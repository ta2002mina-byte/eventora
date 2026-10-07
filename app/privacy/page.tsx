import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getSiteSettings();
  return { title: legal.privacy_title };
}

export default async function PrivacyPage() {
  const { legal } = await getSiteSettings();
  return <LegalPage title={legal.privacy_title} body={legal.privacy_body} />;
}

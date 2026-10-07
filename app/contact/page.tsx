import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const { contact } = await getSiteSettings();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
          Get in touch
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-charcoal-400">
          Questions about planning your event, a venue, or a vendor
          partnership? Send us a message and we&apos;ll get back to you soon.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {contact.email && (
            <div className="flex items-start gap-3 rounded-card border border-border bg-white p-5 shadow-softer">
              <Mail className="mt-0.5 h-5 w-5 text-purple-700" />
              <div>
                <p className="text-sm font-medium text-charcoal">Email</p>
                <p className="text-sm text-charcoal-400">{contact.email}</p>
              </div>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-start gap-3 rounded-card border border-border bg-white p-5 shadow-softer">
              <Phone className="mt-0.5 h-5 w-5 text-purple-700" />
              <div>
                <p className="text-sm font-medium text-charcoal">Phone</p>
                <p className="text-sm text-charcoal-400">{contact.phone}</p>
              </div>
            </div>
          )}
          {contact.address && (
            <div className="flex items-start gap-3 rounded-card border border-border bg-white p-5 shadow-softer">
              <MapPin className="mt-0.5 h-5 w-5 text-purple-700" />
              <div>
                <p className="text-sm font-medium text-charcoal">Office</p>
                <p className="text-sm text-charcoal-400">{contact.address}</p>
              </div>
            </div>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

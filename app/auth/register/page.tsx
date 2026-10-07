import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage() {
  const { platform } = await getSiteSettings();

  if (!platform.allow_registration) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-charcoal">Sign-ups are closed</h1>
        <p className="mt-2 text-sm text-charcoal-400">
          We aren&apos;t accepting new accounts right now. If you already have an account, you can still sign in.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/login"><Button>Sign in</Button></Link>
          <Link href="/contact"><Button variant="outline">Contact us</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-charcoal">Create your account</h1>
        <p className="mt-2 text-sm text-charcoal-400">
          Plan less. Celebrate more. Get started for free.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

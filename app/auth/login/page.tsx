import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-charcoal">Welcome back</h1>
        <p className="mt-2 text-sm text-charcoal-400">
          Sign in to plan your next event.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

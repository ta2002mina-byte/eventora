"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Always show the same success message, whether or not the email
    // exists — this avoids leaking which addresses have accounts.
    if (error && error.status && error.status >= 500) {
      setFormError("Something went wrong. Please try again in a moment.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-8 text-center shadow-softer"
      >
        <CheckCircle2 className="h-9 w-9 text-purple-700" />
        <p className="text-sm text-charcoal-600">
          If an account exists for that email, we&apos;ve sent a password
          reset link. Check your inbox (and spam folder).
        </p>
        <Link href="/auth/login" className="text-sm font-medium text-purple-700 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Send Reset Link
      </Button>

      <p className="text-center text-sm text-charcoal-400">
        Remembered your password?{" "}
        <Link href="/auth/login" className="font-medium text-purple-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

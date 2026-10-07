"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { submitContactMessage } from "@/app/contact/actions";

const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  subject: z.string().min(2, "Please add a subject"),
  message: z.string().min(10, "Please add a few more details (min 10 characters)"),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactValues) {
    setFormError(null);
    const result = await submitContactMessage(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-card border border-border bg-white p-10 text-center shadow-softer"
      >
        <CheckCircle2 className="h-10 w-10 text-purple-700" />
        <h2 className="font-display text-xl text-charcoal">Message sent</h2>
        <p className="max-w-sm text-sm text-charcoal-400">
          Thanks for reaching out — we&apos;ll get back to you by email shortly.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 rounded-card border border-border bg-white p-6 shadow-softer sm:p-8"
    >
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      <Input
        label="Subject"
        error={errors.subject?.message}
        {...register("subject")}
      />

      <Textarea
        label="Message"
        rows={6}
        error={errors.message?.message}
        {...register("message")}
      />

      <Button type="submit" className="w-full sm:w-auto" isLoading={isSubmitting}>
        Send Message
      </Button>
    </form>
  );
}

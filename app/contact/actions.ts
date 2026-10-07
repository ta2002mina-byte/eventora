"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  subject: z.string().min(2, "Please add a subject"),
  message: z.string().min(10, "Please add a few more details (min 10 characters)"),
});

export interface SubmitContactResult {
  ok: boolean;
  error?: string;
}

export async function submitContactMessage(
  values: z.infer<typeof contactSchema>
): Promise<SubmitContactResult> {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("contact_messages").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

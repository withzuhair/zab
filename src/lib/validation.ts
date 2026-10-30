import { z } from "zod";

export const serviceTypeValues = [
  "OCEAN",
  "AIR",
  "WAREHOUSING",
  "CUSTOMS",
  "RORO_PROJECT",
  "DANGEROUS_GOODS",
  "NOT_SURE",
] as const;

const optionalText = (max: number) => z.string().trim().max(max);

export const quoteSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(100, "Use 100 characters or fewer."),
  company: optionalText(150),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(40, "Use 40 characters or fewer.")
    .regex(/^[0-9+()\s-]*$/, "Use only digits, spaces, +, -, and parentheses."),
  serviceType: z.enum(serviceTypeValues, {
    error: "Choose a service type.",
  }),
  origin: optionalText(100),
  destination: optionalText(100),
  cargoType: optionalText(150),
  weightVolume: optionalText(100),
  message: z
    .string()
    .trim()
    .min(10, "Enter at least 10 characters.")
    .max(2000, "Use 2000 characters or fewer."),
  consent: z.boolean().refine((value) => value, {
    message: "Consent is required to submit this enquiry.",
  }),
  honeypot: z.string().max(500).optional().default(""),
  turnstileToken: z.string().max(2048).optional().default(""),
  sourcePage: z.string().trim().max(200).optional().default("/contact"),
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type QuoteFormValues = z.input<typeof quoteSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type NewsletterFormValues = z.input<typeof newsletterSchema>;

export function getFieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !(field in fields)) {
      fields[field] = issue.message;
    }
  }

  return fields;
}

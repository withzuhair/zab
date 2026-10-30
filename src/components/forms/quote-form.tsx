"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  quoteSchema,
  type QuoteFormValues,
  type QuoteInput,
} from "@/lib/validation";
import { trackQuoteSubmitted } from "@/lib/analytics";
import { TurnstileWidget } from "./turnstile-widget";

type QuoteFormProps = {
  compact?: boolean;
};

const serviceOptions: { value: QuoteInput["serviceType"]; label: string }[] = [
  { value: "OCEAN", label: "Ocean Freight" },
  { value: "AIR", label: "Air Freight" },
  { value: "WAREHOUSING", label: "Warehousing" },
  { value: "CUSTOMS", label: "Customs Clearance" },
  { value: "RORO_PROJECT", label: "RORO or Project Cargo" },
  { value: "DANGEROUS_GOODS", label: "Dangerous Goods" },
  { value: "NOT_SURE", label: "Not sure" },
];

const inputClassName = "min-h-11";

export function QuoteForm({ compact = false }: QuoteFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues, unknown, QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      fullName: "",
      company: "",
      email: "",
      phone: "",
      serviceType: undefined,
      origin: "",
      destination: "",
      cargoType: "",
      weightVolume: "",
      message: "",
      consent: false,
      honeypot: "",
      turnstileToken: "",
    },
  });

  const updateTurnstileToken = useCallback(
    (token: string) => {
      setValue("turnstileToken", token, { shouldValidate: false });
    },
    [setValue],
  );

  const submit = handleSubmit(async (formData) => {
    setSubmitted(false);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sourcePage: window.location.pathname,
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: {
          message?: string;
          fields?: Record<string, string>;
        };
      };

      if (!response.ok || !result.ok) {
        for (const [name, message] of Object.entries(
          result.error?.fields ?? {},
        )) {
          if (name in quoteSchema.shape) {
            setError(name as keyof QuoteInput, {
              type: "server",
              message,
            });
          }
        }

        setError("root.server", {
          type: "server",
          message:
            result.error?.message ??
            "Something went wrong. Please try again or call +971 569 445 296.",
        });
        return;
      }

      trackQuoteSubmitted();
      setSubmitted(true);
    } catch (error) {
      console.error("Enquiry submission failed.", error);
      setError("root.server", {
        type: "server",
        message:
          "Something went wrong. Please try again or call +971 569 445 296.",
      });
    }
  });

  if (submitted) {
    return (
      <p
        className="rounded-lg border border-green-800/30 bg-green-50 p-4 text-green-900"
        role="status"
      >
        Thanks, we have your request. We&apos;ll reply by email as soon as we
        can.
      </p>
    );
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message} required>
          <Input
            autoComplete="name"
            className={inputClassName}
            id="fullName"
            {...register("fullName")}
            aria-required="true"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input
            autoComplete="organization"
            className={inputClassName}
            id="company"
            {...register("company")}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? "company-error" : undefined}
          />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input
            autoComplete="email"
            className={inputClassName}
            id="email"
            type="email"
            {...register("email")}
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
        <Field
          id="phone"
          label="Phone or WhatsApp"
          error={errors.phone?.message}
        >
          <Input
            autoComplete="tel"
            className={inputClassName}
            id="phone"
            type="tel"
            {...register("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
        </Field>
        <Field
          label="Service type"
          error={errors.serviceType?.message}
          required
        >
          <select
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-11 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
            defaultValue=""
            id="serviceType"
            {...register("serviceType")}
            aria-required="true"
            aria-invalid={Boolean(errors.serviceType)}
            aria-describedby={
              errors.serviceType ? "serviceType-error" : undefined
            }
          >
            <option disabled value="">
              Choose a service
            </option>
            {serviceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Origin" error={errors.origin?.message}>
          <Input
            className={inputClassName}
            id="origin"
            {...register("origin")}
            aria-invalid={Boolean(errors.origin)}
            aria-describedby={errors.origin ? "origin-error" : undefined}
          />
        </Field>
        <Field label="Destination" error={errors.destination?.message}>
          <Input
            className={inputClassName}
            id="destination"
            {...register("destination")}
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={
              errors.destination ? "destination-error" : undefined
            }
          />
        </Field>
        <Field label="Cargo type" error={errors.cargoType?.message}>
          <Input
            className={inputClassName}
            id="cargoType"
            {...register("cargoType")}
            aria-invalid={Boolean(errors.cargoType)}
            aria-describedby={errors.cargoType ? "cargoType-error" : undefined}
          />
        </Field>
        <Field
          id="weightVolume"
          label="Approximate weight or volume"
          error={errors.weightVolume?.message}
        >
          <Input
            className={inputClassName}
            id="weightVolume"
            {...register("weightVolume")}
            aria-invalid={Boolean(errors.weightVolume)}
            aria-describedby={
              errors.weightVolume ? "weightVolume-error" : undefined
            }
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Message" error={errors.message?.message} required>
            <Textarea
              className="min-h-32"
              id="message"
              {...register("message")}
              aria-required="true"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
          </Field>
        </div>
      </div>

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="quote-website">Leave this field empty</label>
        <Input
          autoComplete="off"
          id="quote-website"
          tabIndex={-1}
          {...register("honeypot")}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="quote-consent"
                checked={field.value}
                name={field.name}
                onBlur={field.onBlur}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-required="true"
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? "consent-error" : undefined}
              />
            )}
          />
          <label className="text-sm leading-6" htmlFor="quote-consent">
            I agree to be contacted about this enquiry. Please read our{" "}
            <Link className="underline underline-offset-4" href="/privacy">
              privacy policy
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p className="text-destructive mt-1 text-sm" id="consent-error">
            {errors.consent.message}
          </p>
        )}
      </div>

      <TurnstileWidget onToken={updateTurnstileToken} />

      {errors.root?.server && (
        <p className="text-destructive text-sm" role="alert">
          {errors.root.server.message}
        </p>
      )}

      <Button
        className="min-h-11 w-fit px-6"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send enquiry"}
      </Button>

      {compact && (
        <p className="text-muted-foreground text-xs">
          Required fields are marked.
        </p>
      )}

      <input type="hidden" {...register("turnstileToken")} />
    </form>
  );
}

type FieldProps = {
  id?: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({
  id: providedId,
  label,
  error,
  required = false,
  children,
}: FieldProps) {
  const id =
    providedId ??
    label
      .replaceAll(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word[0]!.toUpperCase() + word.slice(1),
      )
      .join("");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="text-destructive text-sm" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);
    setError("");
    setIsSubmitting(true);

    try {
      const email = new FormData(event.currentTarget).get("email");
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: { message?: string; fields?: Record<string, string> };
      };

      if (!response.ok || !result.ok) {
        setError(
          result.error?.fields?.email ??
            result.error?.message ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      setSubmitted(true);
    } catch (requestError) {
      console.error("Newsletter submission failed.", requestError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-muted-foreground mt-3 text-sm" role="status">
        You&apos;re subscribed. Thank you.
      </p>
    );
  }

  return (
    <form className="mt-3 grid gap-2" onSubmit={(event) => void submit(event)}>
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <Input
        autoComplete="email"
        className="min-h-11"
        id="newsletter-email"
        name="email"
        placeholder="Email address"
        type="email"
        required
        aria-describedby={error ? "newsletter-error" : undefined}
        aria-invalid={Boolean(error)}
        aria-required="true"
      />
      {error && (
        <p
          className="text-destructive text-sm"
          id="newsletter-error"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button
        className="min-h-11 w-fit"
        disabled={isSubmitting}
        type="submit"
        variant="outline"
      >
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}

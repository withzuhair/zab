"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

function safeCallbackUrl(url: string) {
  return url.startsWith("/admin/") && !url.startsWith("//")
    ? url
    : url === "/admin"
      ? url
      : "/admin";
}

export function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const destination = safeCallbackUrl(callbackUrl);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: destination,
      redirect: false,
    });

    if (!result?.ok || result.error) {
      setError(true);
      setSubmitting(false);
      return;
    }

    window.location.assign(result.url ?? destination);
  }

  return (
    <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-1 text-sm font-semibold">
        Email
        <input
          autoComplete="username"
          className="min-h-11 rounded-lg border px-3 font-normal"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Password
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-lg border px-3 font-normal"
          name="password"
          required
          type="password"
        />
      </label>
      {error && (
        <p aria-live="assertive" className="text-sm font-medium text-red-800">
          Sign-in failed. Check your details or try again later.
        </p>
      )}
      <button
        className="min-h-11 rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

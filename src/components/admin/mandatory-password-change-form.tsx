"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { changeOwnPassword } from "@/app/admin/actions";

export function MandatoryPasswordChangeForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await changeOwnPassword(formData);
      if (!result.ok) {
        setError(result.message);
        setSubmitting(false);
        return;
      }
      router.replace("/admin/login?passwordChanged=1");
    } catch (error) {
      console.error("Mandatory admin password update failed.", error);
      setError("Password update failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mt-7 grid gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="grid gap-1 text-sm font-semibold">
        Current password
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-lg border px-3 font-normal"
          maxLength={128}
          name="currentPassword"
          required
          type="password"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        New password (12 characters minimum)
        <input
          autoComplete="new-password"
          className="min-h-11 rounded-lg border px-3 font-normal"
          maxLength={128}
          minLength={12}
          name="newPassword"
          required
          type="password"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Confirm new password
        <input
          autoComplete="new-password"
          className="min-h-11 rounded-lg border px-3 font-normal"
          maxLength={128}
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      {error && (
        <p
          aria-live="assertive"
          className="text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="min-h-11 rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}

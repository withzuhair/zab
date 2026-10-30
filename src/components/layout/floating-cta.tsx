"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const FloatingQuoteDialog = dynamic(
  () =>
    import("@/components/layout/floating-quote-dialog").then(
      (module) => module.FloatingQuoteDialog,
    ),
  {
    loading: () => (
      <p className="sr-only" role="status">
        Loading quote form…
      </p>
    ),
    ssr: false,
  },
);

export function FloatingCTA() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed top-1/2 right-0 z-40 hidden min-h-11 -translate-y-1/2 rounded-l-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg [writing-mode:vertical-rl] hover:bg-blue-800 md:inline-flex"
        onClick={() => setDialogOpen(true)}
        type="button"
      >
        Get a Quote
      </Button>
      {dialogOpen && (
        <FloatingQuoteDialog onClose={() => setDialogOpen(false)} />
      )}
    </>
  );
}

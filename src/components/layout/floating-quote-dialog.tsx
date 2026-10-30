"use client";

import { QuoteForm } from "@/components/forms/quote-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FloatingQuoteDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tell us what you&apos;re shipping.</DialogTitle>
          <DialogDescription>
            Share your shipment details and we&apos;ll get back to you.
          </DialogDescription>
        </DialogHeader>
        <QuoteForm compact />
      </DialogContent>
    </Dialog>
  );
}

import { MessageCircle } from "lucide-react";

export function WhatsAppButton({ href }: { href: string }) {
  return (
    <aside
      aria-label="WhatsApp contact"
      className="fixed right-5 bottom-5 z-40"
    >
      <a
        aria-label="Contact ZAB Shipping on WhatsApp"
        className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
      </a>
    </aside>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CTASectionProps = {
  title?: string;
  description?: string;
};

export function CTASection({
  title = "Discuss a shipment with ZAB Shipping",
  description = "Contact the team with your route and cargo details.",
}: CTASectionProps) {
  return (
    <section className="bg-scene-dark text-scene-dark-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 sm:px-10 md:flex-row md:items-center lg:px-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 opacity-80">
            {description}
          </p>
        </div>
        <Link
          className="bg-background text-foreground hover:bg-muted inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
          href="/contact"
          prefetch={false}
        >
          Contact us <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}

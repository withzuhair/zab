import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { createPageMetadata } from "@/lib/seo";
import { getPublicServices } from "@/lib/public-content";

export const metadata: Metadata = createPageMetadata(seo.pages.services);

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex flex-1 items-center justify-center px-6 py-24"
          id="main-content"
          role="status"
        >
          Loading…
        </main>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}

async function ServicesPageContent() {
  const services = await getPublicServices();

  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <PageBanner
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
        title="Logistics services"
      />
      <section
        aria-label="Available logistics services"
        className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-14 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-16"
      >
        {services.map((service) => (
          <Link
            className="group border-border bg-card hover:border-primary flex min-h-40 flex-col justify-between rounded-2xl border p-6 transition-colors"
            href={`/services/${service.slug}`}
            key={service.slug}
            prefetch={false}
          >
            <span>
              <span className="block text-xl font-semibold">
                {service.title}
              </span>
              <span className="text-muted-foreground mt-2 block text-sm leading-6">
                {service.summary}
              </span>
            </span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Learn more
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}

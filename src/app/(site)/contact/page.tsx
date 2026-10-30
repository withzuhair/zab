import type { Metadata } from "next";
import { Suspense } from "react";
import { contactContent } from "@content/contact";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { QuoteForm } from "@/components/forms/quote-form";
import { createPageMetadata } from "@/lib/seo";
import { getPublicCompanySettings } from "@/lib/public-content";

export const metadata: Metadata = createPageMetadata(seo.pages.contact);

export default function ContactPage() {
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
      <ContactPageContent />
    </Suspense>
  );
}

async function ContactPageContent() {
  const company = await getPublicCompanySettings();

  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <PageBanner
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        title={contactContent.title}
      />
      <section className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 lg:px-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            {contactContent.heading}
          </h2>
          <p className="text-muted-foreground mt-3 leading-7">
            {contactContent.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700/90"
              href={company.whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              {contactContent.whatsappLabel}
            </a>
            <a
              className="inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold"
              href={`tel:${company.phone.replaceAll(" ", "")}`}
            >
              {contactContent.callLabel} {company.phone}
            </a>
          </div>
          <address className="text-muted-foreground mt-8 grid gap-2 not-italic">
            <a
              className="hover:text-foreground"
              href={`mailto:${company.email}`}
            >
              {company.email}
            </a>
            <span>{company.address}</span>
          </address>
          <div className="mt-10 border-t pt-8">
            <QuoteForm />
          </div>
        </div>
      </section>
    </main>
  );
}

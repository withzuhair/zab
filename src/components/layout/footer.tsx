import Link from "next/link";
import { cacheLife } from "next/cache";
import { site } from "@content/site";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import type { PublicCompanySettings } from "@/lib/public-content";

type NavigationService = { label: string; href: string };

async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({
  company,
  services,
}: {
  company: PublicCompanySettings;
  services: NavigationService[];
}) {
  const currentYear = await getCurrentYear();

  return (
    <footer className="border-border bg-muted/40 border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 sm:px-10 md:grid-cols-2 lg:grid-cols-5 lg:px-16">
        <div>
          <Link
            className="text-lg font-bold tracking-tight"
            href="/"
            prefetch={false}
          >
            {company.name}
          </Link>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-6">
            {site.tagline}
          </p>
        </div>
        <nav aria-label="Footer services">
          <h2 className="text-sm font-semibold">Services</h2>
          <ul className="mt-3 grid gap-2">
            {services.map((service) => (
              <li key={service.href}>
                <Link
                  className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
                  href={service.href}
                  prefetch={false}
                >
                  {service.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold">Quick links</h2>
          <ul className="mt-3 grid gap-2">
            {site.footerNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
                  href={item.href}
                  prefetch={false}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Contact details</h2>
          <a
            className="text-muted-foreground hover:text-foreground mt-3 inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
            href={company.whatsappUrl}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp: {company.phone}
          </a>
          <address className="text-muted-foreground mt-3 grid gap-2 text-sm leading-6 not-italic">
            <span>{company.address}</span>
            <a
              className="hover:text-foreground"
              href={`tel:${company.phone.replaceAll(" ", "")}`}
            >
              {company.phone}
            </a>
            <a
              className="hover:text-foreground"
              href={`mailto:${company.email}`}
            >
              {company.email}
            </a>
          </address>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{site.newsletterPrompt}</h2>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-border border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-7xl px-6 py-4 text-xs sm:px-10 lg:px-16">
          © {currentYear} {company.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

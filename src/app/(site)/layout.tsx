import { Suspense, type ReactNode } from "react";
import Script from "next/script";
import { FloatingCTA } from "@/components/layout/floating-cta";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { SiteStructuredData } from "@/components/seo/json-ld";
import { services as fallbackServices } from "@content/services";
import { site } from "@content/site";
import {
  getPublicCompanySettings,
  getPublicServices,
} from "@/lib/public-content";

type NavigationService = { label: string; href: string };

function getFallbackServices(): NavigationService[] {
  return fallbackServices.map((service) => ({
    label: service.title,
    href: `/services/${service.slug}`,
  }));
}

async function SiteChrome({ children }: { children: ReactNode }) {
  const [company, services] = await Promise.all([
    getPublicCompanySettings(),
    getPublicServices(),
  ]);
  const navigationServices = services.map((service) => ({
    label: service.title,
    href: `/services/${service.slug}`,
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteStructuredData company={company} />
      <Header companyName={company.name} services={navigationServices} />
      {children}
      <Footer company={company} services={navigationServices} />
      <FloatingCTA />
      <WhatsAppButton href={company.whatsappUrl} />
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
        <Script
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const navigationServices = getFallbackServices();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 flex-col">
          <Header companyName={site.name} services={navigationServices} />
          {children}
          <FloatingCTA />
          <WhatsAppButton href={site.whatsappUrl} />
        </div>
      }
    >
      <SiteChrome>{children}</SiteChrome>
    </Suspense>
  );
}

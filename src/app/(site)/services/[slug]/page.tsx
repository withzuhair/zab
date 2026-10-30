import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";
import { services, type ServiceSlug } from "@content/services";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { ServiceStructuredData } from "@/components/seo/json-ld";
import { ServiceSidebar } from "@/components/content/service-sidebar";
import { FeatureList } from "@/components/content/feature-list";
import { CommodityTags } from "@/components/content/commodity-tags";
import { CTASection } from "@/components/content/cta-section";
import { StatStrip } from "@/components/content/stat-strip";
import { createPageMetadata } from "@/lib/seo";
import {
  getPublicCompanySettings,
  getPublicContentSettings,
  getPublicServices,
} from "@/lib/public-content";

const seoPageBySlug: Record<
  ServiceSlug,
  (typeof seo.pages)[keyof typeof seo.pages]
> = {
  "ocean-freight": seo.pages.ocean,
  "air-freight": seo.pages.air,
  warehousing: seo.pages.warehousing,
  "freight-forwarding": seo.pages.forwarding,
  specialised: seo.pages.specialised,
} as const;

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);

  if (!service) return {};

  return createPageMetadata(seoPageBySlug[service.slug]);
}

function ServiceLoading() {
  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center px-6 py-24"
    >
      <p role="status" className="text-muted-foreground">
        Loading service details…
      </p>
    </main>
  );
}

export default function ServicePage({ params }: ServicePageProps) {
  return (
    <Suspense fallback={<ServiceLoading />}>
      <ServicePageContent params={params} />
    </Suspense>
  );
}

async function ServicePageContent({ params }: ServicePageProps) {
  const { slug } = await params;
  const [publicServices, company, publicSettings] = await Promise.all([
    getPublicServices(),
    getPublicCompanySettings(),
    getPublicContentSettings(),
  ]);
  const service = publicServices.find((item) => item.slug === slug);

  if (!service) notFound();

  return (
    <>
      <ServiceStructuredData service={service} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <PageBanner
          breadcrumbs={[{ label: "Home", href: "/" }, { label: service.title }]}
          title={service.headline}
        />
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[2fr_1fr] lg:px-16">
          <article className="grid content-start gap-8">
            {service.bodyMarkdown ? (
              <div className="text-muted-foreground grid max-w-3xl gap-5 text-lg leading-8">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-foreground text-2xl font-bold">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => (
                      <ul className="grid gap-3 sm:grid-cols-2">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="bg-background text-foreground rounded-md border px-4 py-3 text-sm">
                        {children}
                      </li>
                    ),
                  }}
                >
                  {service.bodyMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <>
                {service.paragraphs.map((paragraph) => (
                  <p
                    className="text-muted-foreground max-w-3xl text-lg leading-8"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
                {service.sections.map((section) => (
                  <section className="grid gap-4" key={section.title}>
                    <div>
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                      <p className="text-muted-foreground mt-2 max-w-3xl leading-7">
                        {section.body}
                      </p>
                    </div>
                    {section.items.length > 0 && (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {section.items.map((item) => (
                          <li
                            className="bg-background rounded-md border px-4 py-3 text-sm"
                            key={item}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </>
            )}
            <FeatureList
              items={service.highlights}
              title="Service highlights"
            />
            {service.slug === "warehousing" &&
              publicSettings.warehouseLocations.confirmed && (
                <section>
                  <h2 className="text-2xl font-bold">Locations</h2>
                  <p className="text-muted-foreground mt-2 leading-7">
                    {publicSettings.warehouseLocations.locations}
                  </p>
                </section>
              )}
            {service.slug === "ocean-freight" && (
              <StatStrip stats={[publicSettings.statistics.team]} />
            )}
            {service.commodities.length > 0 && (
              <section aria-labelledby="commodities-heading">
                <h2
                  id="commodities-heading"
                  className="mb-4 text-xl font-semibold"
                >
                  Commodities
                </h2>
                <CommodityTags items={service.commodities} />
              </section>
            )}
            {service.closing && (
              <p className="text-muted-foreground max-w-3xl text-lg leading-8">
                {service.closing}
              </p>
            )}
          </article>
          <ServiceSidebar
            currentSlug={service.slug}
            phone={company.phone}
            services={publicServices}
          />
        </div>
      </main>
      <CTASection />
    </>
  );
}

import { seo } from "@content/seo";
import type {
  PublicCompanySettings,
  PublicService,
} from "@/lib/public-content";

type Breadcrumb = {
  label: string;
  href?: string;
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function SiteStructuredData({
  company,
}: {
  company: PublicCompanySettings;
}) {
  const organizationId = `${seo.siteUrl}/#organization`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": organizationId,
            name: company.name,
            url: seo.siteUrl,
            logo: `${seo.siteUrl}/images/branding/zab-shipping-llc-logo.png`,
            telephone: company.phone,
            email: company.email,
            address: company.address,
          },
          {
            "@type": "LocalBusiness",
            "@id": `${seo.siteUrl}/#localbusiness`,
            name: company.name,
            url: seo.siteUrl,
            image: `${seo.siteUrl}/opengraph-image`,
            telephone: company.phone,
            email: company.email,
            address: company.address,
            parentOrganization: { "@id": organizationId },
          },
        ],
      }}
    />
  );
}

export function BreadcrumbStructuredData({
  breadcrumbs,
}: {
  breadcrumbs: readonly Breadcrumb[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((breadcrumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: breadcrumb.label,
          ...(breadcrumb.href
            ? { item: new URL(breadcrumb.href, seo.siteUrl).toString() }
            : {}),
        })),
      }}
    />
  );
}

export function ServiceStructuredData({ service }: { service: PublicService }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.summary,
        serviceType: service.title,
        url: new URL(`/services/${service.slug}`, seo.siteUrl).toString(),
        provider: { "@id": `${seo.siteUrl}/#organization` },
      }}
    />
  );
}

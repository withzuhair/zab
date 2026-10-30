import type { Metadata } from "next";
import { Suspense } from "react";
import { aboutContent } from "@content/about";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { StatStrip } from "@/components/content/stat-strip";
import { createPageMetadata } from "@/lib/seo";
import { getPublicContentSettings } from "@/lib/public-content";

export const metadata: Metadata = createPageMetadata(seo.pages.about);

export default function AboutPage() {
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
      <AboutPageContent />
    </Suspense>
  );
}

async function AboutPageContent() {
  const publicSettings = await getPublicContentSettings();

  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <PageBanner
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: aboutContent.title },
        ]}
        title={aboutContent.title}
      />
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-12">
          <div className="text-muted-foreground grid max-w-4xl gap-5 text-lg leading-8">
            {aboutContent.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <section aria-labelledby="mission-heading">
            <h2 className="text-2xl font-bold" id="mission-heading">
              Our mission
            </h2>
            <p className="text-muted-foreground mt-3 max-w-4xl text-lg leading-8">
              {aboutContent.mission}
            </p>
          </section>
          <section aria-labelledby="values-heading">
            <h2 className="text-2xl font-bold" id="values-heading">
              Our values
            </h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {aboutContent.values.map((value) => (
                <li
                  className="bg-card rounded-full border px-4 py-2 font-semibold"
                  key={value}
                >
                  {value}
                </li>
              ))}
            </ul>
          </section>
          {publicSettings.hubs.confirmed && (
            <section aria-labelledby="where-we-work-heading">
              <h2 className="text-2xl font-bold" id="where-we-work-heading">
                Where we operate
              </h2>
              <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {publicSettings.hubs.locations.map((location) => (
                  <li key={location}>{location}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <StatStrip stats={Object.values(publicSettings.statistics)} />
      </div>
    </main>
  );
}

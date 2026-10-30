import type { Metadata } from "next";
import { privacyContent } from "@content/privacy";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata(seo.pages.privacy);

export default function PrivacyPage() {
  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <PageBanner
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        title="Privacy"
      />
      <article className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-14 sm:px-10 lg:px-16">
        <div
          className="border-border bg-muted/40 max-w-3xl rounded-xl border p-6"
          role="note"
        >
          <h2 className="text-lg font-semibold">{privacyContent.draftLabel}</h2>
          <p className="text-muted-foreground mt-3 leading-7">
            {privacyContent.introduction}
          </p>
        </div>
        {privacyContent.sections.map((section) => (
          <section className="max-w-3xl" key={section.title}>
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p
                className="text-muted-foreground mt-3 leading-7"
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}

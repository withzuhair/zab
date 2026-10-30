import type { Metadata } from "next";
import { Suspense } from "react";
import { seo } from "@content/seo";
import { PageBanner } from "@/components/content/page-banner";
import { GalleryExperience } from "@/components/content/gallery-experience";
import { createPageMetadata } from "@/lib/seo";
import { getPublicGallery } from "@/lib/public-content";

export const metadata: Metadata = createPageMetadata(seo.pages.gallery);

export default function GalleryPage() {
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
      <GalleryPageContent />
    </Suspense>
  );
}

async function GalleryPageContent() {
  const galleryItems = await getPublicGallery();

  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      <PageBanner
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]}
        title="Gallery"
      />
      <section
        aria-label="Gallery"
        className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-14 sm:px-10 lg:px-16"
      >
        <GalleryExperience items={galleryItems} />
      </section>
    </main>
  );
}

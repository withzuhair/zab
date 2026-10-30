import type { Metadata } from "next";
import { site } from "@content/site";

type SeoPage = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata(page: SeoPage): Metadata {
  const socialImage = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "ZAB Shipping LLC freight forwarding and logistics",
  };

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      siteName: site.name,
      url: page.path,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [socialImage.url],
    },
  };
}

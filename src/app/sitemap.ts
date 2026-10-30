import type { MetadataRoute } from "next";
import { seo } from "@content/seo";
import { services } from "@content/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    seo.pages.home.path,
    seo.pages.about.path,
    seo.pages.services.path,
    ...services.map((service) => `/services/${service.slug}`),
    seo.pages.gallery.path,
    seo.pages.contact.path,
    seo.pages.privacy.path,
  ];

  return paths.map((path) => ({
    url: new URL(path, seo.siteUrl).toString(),
  }));
}

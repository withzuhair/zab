import type { Metadata } from "next";
import { Archivo, DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { seo } from "@content/seo";
import "../styles/globals.css";

const displayFont = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const textFont = DM_Sans({
  variable: "--font-text",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: seo.pages.home.title,
    template: "%s",
  },
  description: seo.pages.home.description,
  metadataBase: new URL(seo.siteUrl),
  alternates: { canonical: seo.pages.home.path },
  openGraph: {
    type: "website",
    title: seo.pages.home.title,
    description: seo.pages.home.description,
    siteName: "ZAB Shipping LLC",
    url: seo.pages.home.path,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ZAB Shipping LLC freight forwarding and logistics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.pages.home.title,
    description: seo.pages.home.description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${textFont.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        <nav aria-label="Skip links">
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}

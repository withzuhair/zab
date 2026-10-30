import Link from "next/link";
import { BreadcrumbStructuredData } from "@/components/seo/json-ld";

type Breadcrumb = {
  label: string;
  href?: string;
};

type PageBannerProps = {
  title: string;
  breadcrumbs?: readonly Breadcrumb[];
};

export function PageBanner({ title, breadcrumbs = [] }: PageBannerProps) {
  return (
    <>
      <section className="border-border bg-muted/40 border-b">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 sm:py-20 lg:px-16">
          {breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbs.map((breadcrumb, index) => (
                  <li
                    className="flex items-center gap-2"
                    key={breadcrumb.label}
                  >
                    {breadcrumb.href ? (
                      <Link
                        className="hover:text-foreground underline-offset-4 hover:underline"
                        href={breadcrumb.href}
                        prefetch={false}
                      >
                        {breadcrumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page">{breadcrumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span aria-hidden="true">/</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
        </div>
      </section>
      {breadcrumbs.length > 0 && (
        <BreadcrumbStructuredData breadcrumbs={breadcrumbs} />
      )}
    </>
  );
}

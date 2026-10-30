import Link from "next/link";

type ServiceSidebarProps = {
  currentSlug: string;
  services: { slug: string; title: string }[];
  phone: string;
};

export function ServiceSidebar({
  currentSlug,
  services,
  phone,
}: ServiceSidebarProps) {
  return (
    <aside className="grid content-start gap-5">
      <nav
        aria-label="Services"
        className="border-border rounded-xl border p-5"
      >
        <h2 className="font-semibold">Services</h2>
        <ul className="mt-3 grid gap-1">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                aria-current={service.slug === currentSlug ? "page" : undefined}
                className="text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors aria-[current=page]:font-semibold"
                href={`/services/${service.slug}`}
                prefetch={false}
              >
                {service.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <section className="bg-scene-dark text-scene-dark-foreground rounded-xl p-5">
        <h2 className="font-semibold">Discuss your shipment</h2>
        <a
          className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
          href={`tel:${phone.replaceAll(" ", "")}`}
        >
          {phone}
        </a>
        <Link
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-4 text-sm font-semibold text-white"
          href="/contact"
          prefetch={false}
        >
          Get a quote
        </Link>
      </section>
    </aside>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu } from "lucide-react";
import { site } from "@content/site";

type NavigationService = { label: string; href: string };

function NavigationLinks({ services }: { services: NavigationService[] }) {
  return (
    <>
      {site.primaryNavigation.slice(0, 2).map((item) => (
        <Link
          key={item.href}
          className="text-foreground/80 hover:text-foreground flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors"
          href={item.href}
          prefetch={false}
        >
          {item.label}
        </Link>
      ))}
      <details className="group relative">
        <summary className="text-foreground/80 hover:text-foreground flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden">
          Services
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <ul className="border-border bg-popover text-popover-foreground absolute top-full left-0 z-20 mt-2 grid w-72 gap-1 rounded-xl border p-2 shadow-lg">
          <li>
            <Link
              className="hover:bg-accent flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold"
              href="/services"
              prefetch={false}
            >
              All services
            </Link>
          </li>
          {services.map((service) => (
            <li key={service.href}>
              <Link
                className="hover:bg-accent flex min-h-11 items-center rounded-lg px-3 text-sm"
                href={service.href}
                prefetch={false}
              >
                {service.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      {site.primaryNavigation.slice(2).map((item) => (
        <Link
          key={item.href}
          className="text-foreground/80 hover:text-foreground flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors"
          href={item.href}
          prefetch={false}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function Header({
  companyName,
  services,
}: {
  companyName: string;
  services: NavigationService[];
}) {
  return (
    <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-4 px-6 sm:px-10 lg:px-16">
        <Link
          aria-label={`${companyName} home`}
          className="flex min-h-11 shrink-0 items-center"
          href="/"
          prefetch={false}
        >
          <Image
            alt={`${companyName} home`}
            className="h-10 w-auto sm:h-12"
            height={772}
            priority
            sizes="(max-width: 639px) 115px, 138px"
            src="/images/branding/zab-shipping-llc-logo.png"
            width={2220}
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center md:flex"
        >
          <NavigationLinks services={services} />
        </nav>
        <Link
          className="hidden min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700/90 md:inline-flex"
          href="/contact"
          prefetch={false}
        >
          Get a Quote
        </Link>
        <details className="group relative md:hidden">
          <summary className="border-border flex size-11 cursor-pointer list-none items-center justify-center rounded-lg border [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Toggle navigation</span>
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="border-border bg-popover text-popover-foreground absolute top-full right-0 mt-3 grid w-[min(90vw,22rem)] gap-1 rounded-xl border p-3 shadow-lg"
          >
            <NavigationLinks services={services} />
            <Link
              className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white"
              href="/contact"
              prefetch={false}
            >
              Get a Quote
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

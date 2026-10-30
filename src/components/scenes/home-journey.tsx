"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { homeContent } from "@content/home";
import type { PublicService } from "@/lib/public-content";

const CONTAINER_COLORS = [
  "#e11d48",
  "#f59e0b",
  "#16a34a",
  "#2563eb",
  "#f8fafc",
  "#7c3aed",
  "#0ea5e9",
];

/* ---------- Art (pure SVG, no hooks) ---------- */

function ShipTop() {
  const rows = Array.from({ length: 13 }, (_, r) => r);
  const cols = Array.from({ length: 4 }, (_, c) => c);
  return (
    <svg
      aria-hidden="true"
      className="block h-full w-auto"
      viewBox="0 0 220 1000"
    >
      <path
        d="M110 0C170 60 205 160 205 300V940Q205 985 165 992H55Q15 985 15 940V300C15 160 50 60 110 0Z"
        fill="#0f1b3d"
      />
      {rows.flatMap((r) =>
        cols.map((c) => (
          <rect
            fill={CONTAINER_COLORS[(r * 3 + c * 2) % CONTAINER_COLORS.length]}
            height={48}
            key={`${r}-${c}`}
            rx={2}
            width={38}
            x={28 + c * 42}
            y={230 + r * 54}
          />
        )),
      )}
      <rect fill="#f1f5f9" height={45} rx={4} width={80} x={70} y={935} />
    </svg>
  );
}

function GroundScene() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
      viewBox="0 0 1200 500"
    >
      <line
        stroke="#cbd5e1"
        strokeWidth="2"
        x1="-600"
        x2="2000"
        y1="456"
        y2="456"
      />

      {/* Reach stacker (static) */}
      <g>
        <rect fill="#1d4ed8" height="60" rx="8" width="170" x="90" y="360" />
        <rect fill="#1e40af" height="60" rx="6" width="80" x="110" y="300" />
        <polygon fill="#f59e0b" points="250,330 610,195 622,215 262,350" />
        <circle cx="130" cy="430" fill="#0f172a" r="26" />
        <circle cx="225" cy="430" fill="#0f172a" r="26" />
      </g>

      {/* Truck (drives away) */}
      <g className="j-truck">
        <rect fill="#334155" height="14" width="400" x="500" y="390" />
        <rect fill="#0f172a" height="64" rx="8" width="90" x="905" y="340" />
        <rect fill="#bae6fd" height="22" rx="3" width="34" x="955" y="350" />
        <circle cx="560" cy="430" fill="#0f172a" r="26" />
        <circle cx="620" cy="430" fill="#0f172a" r="26" />
        <circle cx="940" cy="430" fill="#0f172a" r="26" />
        <circle cx="990" cy="430" fill="#0f172a" r="26" />
      </g>

      {/* Hanging load (lowers onto trailer, then leaves with the truck) */}
      <g className="j-load">
        <line
          stroke="#475569"
          strokeWidth="4"
          x1="616"
          x2="620"
          y1="205"
          y2="225"
        />
        <rect fill="#e2e8f0" height="60" rx="3" width="180" x="530" y="225" />
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            stroke="#94a3b8"
            strokeWidth="3"
            x1={552 + i * 20}
            x2={552 + i * 20}
            y1="231"
            y2="279"
          />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Component ---------- */

export function HomeJourney({ services }: { services: PublicService[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const [arrival, oneRoof, ocean] = homeContent.scenes;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const q = gsap.utils.selector(root);

        // Initial states
        gsap.set(q(".j-dark"), { yPercent: 100 });
        gsap.set(q(".j-curtain-l"), { xPercent: -100 });
        gsap.set(q(".j-curtain-r"), { xPercent: 100 });
        gsap.set(q(".j-ocean"), { autoAlpha: 0 });
        gsap.set(q(".j-ship"), { yPercent: 28, scale: 1.45 });
        gsap.set(q(".j-ocean-copy"), { autoAlpha: 0, y: 40 });
        gsap.set(q(".j-mist"), { autoAlpha: 0 });
        gsap.set(q(".j-service"), { autoAlpha: 0, y: 24 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top+=72",
            end: "+=600%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Act 1 — crane lowers container, truck drives away
        tl.to(
          q(".j-load"),
          { y: 105, duration: 1.2, ease: "power1.inOut" },
          0.3,
        )
          .to(q(".j-act1-copy"), { autoAlpha: 0, y: -30, duration: 0.8 }, 1.8)
          .to(
            [...q(".j-load"), ...q(".j-truck")],
            { x: 1000, duration: 1.8, ease: "power2.in" },
            1.8,
          )

          // Act 2 — dark panel rises, services fade up
          .to(
            q(".j-dark"),
            { yPercent: 0, duration: 1.2, ease: "power2.out" },
            3.4,
          )
          .to(
            q(".j-service"),
            { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.18 },
            4.1,
          )

          // Act 3 — curtains close, ocean prepared underneath, curtains open
          .to(
            [...q(".j-curtain-l"), ...q(".j-curtain-r")],
            { xPercent: 0, duration: 1, ease: "power2.inOut" },
            5.4,
          )
          .set(q(".j-ocean"), { autoAlpha: 1 }, 6.5)
          .to(
            q(".j-curtain-l"),
            { xPercent: -101, duration: 1.2, ease: "power2.inOut" },
            6.9,
          )
          .to(
            q(".j-curtain-r"),
            { xPercent: 101, duration: 1.2, ease: "power2.inOut" },
            6.9,
          )

          // Act 4 — ship sails, foam scrolls, copy appears
          .fromTo(
            q(".j-foam"),
            { backgroundPositionY: "0px" },
            { backgroundPositionY: "1600px", duration: 4.2 },
            6.9,
          )
          .to(q(".j-ship"), { scale: 1.2, yPercent: 12, duration: 1.6 }, 6.9)
          .to(q(".j-ocean-copy"), { autoAlpha: 1, y: 0, duration: 0.7 }, 8.0)

          // Act 5 — sail away into mist
          .to(q(".j-ocean-copy"), { autoAlpha: 0, y: -30, duration: 0.5 }, 9.2)
          .to(
            q(".j-ship"),
            { scale: 0.28, yPercent: -42, duration: 1.4, ease: "power1.in" },
            9.2,
          )
          .to(q(".j-mist"), { autoAlpha: 1, duration: 1 }, 9.8);

        return () => tl.kill();
      },
    );

    return () => mm.revert();
  }, []);

  const featured = services.slice(0, 4);

  return (
    <section
      aria-label="ZAB Shipping — our freight journey"
      className="journey-stage bg-scene-light text-scene-light-foreground relative isolate h-[calc(100svh-4.5rem)] overflow-hidden"
      data-journey
      ref={rootRef}
    >
      {/* Layer 1: light scene */}
      <div className="absolute inset-0">
        <div className="j-act1-copy absolute top-10 left-6 z-10 max-w-xl sm:left-10 lg:left-16">
          <p className="text-sm font-bold tracking-[0.18em] uppercase">
            {arrival.label}
          </p>
          <h1 className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.04] font-extrabold tracking-tight uppercase">
            {arrival.title}
          </h1>
          <p className="mt-5 text-lg leading-8">{arrival.description}</p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-700/90"
            href={arrival.link.href}
            prefetch={false}
          >
            {arrival.link.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <GroundScene />
      </div>

      {/* Layer 2: dark panel */}
      <div className="j-dark bg-scene-dark text-scene-dark-foreground absolute inset-0 flex items-center">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 sm:px-10 lg:grid-cols-[1fr_1.2fr] lg:px-16">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] uppercase">
              {oneRoof.label}
            </p>
            <h2 className="mt-4 text-[clamp(2.25rem,4.5vw,4.5rem)] leading-[1.05] font-extrabold tracking-tight uppercase">
              {oneRoof.title}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8">
              {oneRoof.description}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 self-center">
            {featured.map((service) => (
              <li className="j-service" key={service.slug}>
                <Link
                  className="block rounded-lg border border-white/20 p-5 transition-colors hover:bg-white/10"
                  href={`/services/${service.slug}`}
                  prefetch={false}
                >
                  <span className="block text-lg font-bold">
                    {service.title}
                  </span>
                  <span className="mt-2 block text-sm leading-6 opacity-80">
                    {service.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Layer 3: ocean (hidden until curtains close) */}
      <div
        className="j-ocean absolute inset-0 text-white"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #1d4ed8 0%, #0a2a9c 55%, #04145f 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="j-foam absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0) 0 38px, rgba(255,255,255,.16) 39px 43px, rgba(255,255,255,0) 44px 90px)",
            backgroundSize: "100% 90px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="j-ship relative h-[115%]">
            <div
              className="absolute top-[88%] left-1/2 h-[70%] w-[260%] -translate-x-1/2 blur-[6px]"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,.55), rgba(255,255,255,0))",
                clipPath: "polygon(46% 0, 54% 0, 100% 100%, 0 100%)",
              }}
            />
            <ShipTop />
          </div>
        </div>
        <div className="j-ocean-copy absolute bottom-10 left-6 max-w-2xl sm:left-10 lg:left-16">
          <h2 className="text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.05] font-extrabold tracking-tight uppercase">
            {ocean.title}
          </h2>
          <p className="mt-4 text-lg leading-8">{ocean.description}</p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-blue-700 hover:bg-sky-100"
            href={ocean.link.href}
            prefetch={false}
          >
            {ocean.link.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="j-mist pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, #ffffff 0%, rgba(255,255,255,.92) 60%, #ffffff 100%)",
          }}
        />
      </div>

      {/* Layer 4: split curtains */}
      <div className="j-curtain-l bg-scene-light text-scene-light-foreground absolute inset-y-0 left-0 flex w-1/2 items-center px-6 sm:px-10 lg:px-16">
        <h2 className="text-[clamp(2.25rem,4.5vw,4.5rem)] leading-[1.05] font-extrabold tracking-tight uppercase">
          {ocean.label}
        </h2>
      </div>
      <div className="j-curtain-r bg-scene-light text-scene-light-foreground absolute inset-y-0 right-0 flex w-1/2 items-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-md">
          <p className="text-lg leading-8">{ocean.description}</p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-700/90"
            href={ocean.link.href}
            prefetch={false}
          >
            {ocean.link.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

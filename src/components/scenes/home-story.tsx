import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { homeContent } from "@content/home";
import { confirmationFlags } from "@content/confirm-flags";
import {
  ContainerStack,
  DocStack,
  HazardDiamond,
  NetworkMap,
  Plane,
  ReachStacker,
  RoRoShip,
  Ship,
  Truck,
  Warehouse,
} from "@/components/illustrations/logistics";
import { StatStrip } from "@/components/content/stat-strip";
import { HomeStoryAnimations } from "@/components/scenes/home-story-animations";
import type {
  PublicContentSettings,
  PublicService,
} from "@/lib/public-content";

type Scene = (typeof homeContent.scenes)[number];

const sceneThemeClasses = {
  light: "bg-scene-light text-scene-light-foreground",
  dark: "bg-scene-dark text-scene-dark-foreground",
  ocean: "bg-scene-ocean text-scene-dark-foreground",
  dusk: "scene-dusk text-scene-dark-foreground",
  blue: "bg-scene-blue text-scene-dark-foreground",
} as const;

const sceneFillClasses = {
  light: "fill-scene-light",
  dark: "fill-scene-dark",
  ocean: "fill-scene-ocean",
  dusk: "fill-scene-dark",
  blue: "fill-scene-blue",
} as const;

function SceneArt({
  kind,
  hubs,
}: {
  kind: Scene["art"];
  hubs: PublicContentSettings["hubs"];
}) {
  switch (kind) {
    case "reach-stacker":
      return (
        <div className="grid grid-cols-2 items-end gap-2">
          <ContainerStack />
          <ReachStacker />
        </div>
      );
    case "truck":
      return <Truck />;
    case "ship":
      return <Ship />;
    case "plane":
      return <Plane />;
    case "warehouse":
      return <Warehouse />;
    case "documents":
      return <DocStack />;
    case "specialised":
      return (
        <div className="grid items-center gap-5">
          <RoRoShip />
          <HazardDiamond />
        </div>
      );
    case "network":
      return <NetworkMap locations={hubs.confirmed ? hubs.locations : []} />;
    case "none":
      return null;
  }
}

function SceneSection({
  scene,
  index,
  publicSettings,
}: {
  scene: Scene;
  index: number;
  publicSettings: PublicContentSettings;
}) {
  const Heading = index === 0 ? "h1" : "h2";
  const nextScene = homeContent.scenes[index + 1];
  const nextFill = nextScene && sceneFillClasses[nextScene.theme];
  const isCallToAction = scene.art === "none";

  return (
    <section
      aria-labelledby={`scene-${scene.id}-heading`}
      className={`relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden py-16 ${sceneThemeClasses[scene.theme]}`}
      data-scene={scene.id}
      id={`scene-${scene.id}`}
    >
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 sm:px-10 lg:gap-16 lg:px-16 ${
          isCallToAction
            ? "justify-items-center text-center"
            : "md:grid-cols-[1.1fr_.9fr]"
        }`}
      >
        <div className={isCallToAction ? "max-w-4xl" : ""} data-reveal>
          <p className="text-sm font-bold tracking-[0.18em] uppercase">
            {scene.label}
          </p>
          <Heading
            className="mt-4 max-w-4xl text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.04] font-extrabold tracking-tight uppercase"
            id={`scene-${scene.id}-heading`}
          >
            {scene.title}
          </Heading>
          <p className="mt-5 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
            {scene.description}
          </p>
          {scene.id === "proof" && (
            <StatStrip stats={Object.values(publicSettings.statistics)} />
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors ${
                scene.theme === "blue"
                  ? "bg-white text-blue-700 hover:bg-sky-100"
                  : "bg-blue-700 text-white hover:bg-blue-700/90"
              }`}
              href={scene.link.href}
              prefetch={false}
            >
              {scene.link.label}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            {"secondaryLink" in scene && (
              <a
                className="inline-flex min-h-11 items-center rounded-full border border-current px-5 text-sm font-bold transition-colors hover:bg-white/10"
                href={scene.secondaryLink.href}
                rel="noreferrer"
                target="_blank"
              >
                {scene.secondaryLink.label}
              </a>
            )}
          </div>
        </div>
        {!isCallToAction && (
          <div
            aria-hidden="true"
            className="mx-auto w-full max-w-md [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            data-art
            data-art-kind={scene.art}
          >
            <SceneArt kind={scene.art} hubs={publicSettings.hubs} />
          </div>
        )}
      </div>
      {nextFill && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 120"
        >
          <path
            className={nextFill}
            d="M0 0c240 70 480 104 720 104S1200 70 1440 0v120H0z"
          />
        </svg>
      )}
      {index === 0 && (
        <a
          aria-label="Scroll to the next scene"
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 rounded-full border border-current p-3 opacity-70 transition-opacity hover:opacity-100 md:inline-flex"
          href="#scene-one-roof"
        >
          <ArrowDown aria-hidden="true" className="size-4" />
        </a>
      )}
    </section>
  );
}

function WhyChooseSection() {
  const membershipConfirmed =
    confirmationFlags.membership.confirmed &&
    confirmationFlags.membership.name.length > 0;

  return (
    <section
      aria-labelledby="why-choose-heading"
      className="bg-background text-foreground px-6 py-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          className="max-w-3xl text-4xl font-extrabold tracking-tight uppercase sm:text-5xl"
          id="why-choose-heading"
        >
          {homeContent.whyChooseTitle}
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeContent.whyChoose.map((reason) => (
            <li
              className="bg-card rounded-lg border p-6 shadow-sm"
              key={reason.title}
            >
              <h3 className="text-xl font-bold">{reason.title}</h3>
              <p className="text-muted-foreground mt-3 leading-7">
                {reason.description}
              </p>
            </li>
          ))}
          {membershipConfirmed && (
            <li className="bg-card rounded-lg border p-6 shadow-sm">
              <h3 className="text-xl font-bold">
                {homeContent.membershipReason.title}
              </h3>
              <p className="mt-3 leading-7">
                {homeContent.membershipReason.prefix}
                {confirmationFlags.membership.name}
              </p>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

function ServicesOverview({ services }: { services: PublicService[] }) {
  return (
    <section
      aria-labelledby="home-services-heading"
      className="bg-sky-100 px-6 py-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-700 uppercase">
          Services
        </p>
        <h2
          className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight uppercase sm:text-5xl"
          id="home-services-heading"
        >
          {homeContent.servicesTitle}
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
          {homeContent.servicesDescription}
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.slug}>
              <Link
                className="group bg-card flex min-h-48 flex-col justify-between rounded-lg border p-6 shadow-sm transition-transform hover:-translate-y-1"
                href={`/services/${service.slug}`}
                prefetch={false}
              >
                <span>
                  <span className="block text-xl font-bold">
                    {service.title}
                  </span>
                  <span className="text-muted-foreground mt-3 block leading-7">
                    {service.summary}
                  </span>
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                  Explore service
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeStory({
  publicSettings,
  services,
}: {
  publicSettings: PublicContentSettings;
  services: PublicService[];
}) {
  return (
    <main
      aria-label="ZAB Shipping freight forwarding"
      className="flex-1"
      data-home-story
      id="main-content"
      tabIndex={-1}
    >
      <HomeStoryAnimations />
      {homeContent.scenes.map((scene, index) => (
        <SceneSection
          index={index}
          key={scene.id}
          publicSettings={publicSettings}
          scene={scene}
        />
      ))}
      <WhyChooseSection />
      <ServicesOverview services={services} />
    </main>
  );
}

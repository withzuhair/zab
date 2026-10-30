import { Suspense } from "react";
import { HomeStory } from "@/components/scenes/home-story";
import {
  getPublicContentSettings,
  getPublicServices,
} from "@/lib/public-content";

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [publicSettings, services] = await Promise.all([
    getPublicContentSettings(),
    getPublicServices(),
  ]);

  return <HomeStory publicSettings={publicSettings} services={services} />;
}

"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HomeStoryAnimations() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const story = document.querySelector<HTMLElement>("[data-home-story]");
    if (!story) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let cancelActiveMode = () => {};

    const applyAnimationMode = () => {
      cancelActiveMode();
      cancelActiveMode = () => {};

      if (reducedMotionQuery.matches) return;

      if (mobileQuery.matches) {
        const animatedElements = Array.from(
          story.querySelectorAll<HTMLElement>("[data-reveal], [data-art]"),
        );
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-animation-visible", "true");
              observer.unobserve(entry.target);
            }
          }
        });

        animatedElements.forEach((element) => observer.observe(element));
        story.setAttribute("data-animations-ready", "true");
        cancelActiveMode = () => {
          observer.disconnect();
          story.removeAttribute("data-animations-ready");
          animatedElements.forEach((element) =>
            element.removeAttribute("data-animation-visible"),
          );
        };
        return;
      }

      const matchMedia = gsap.matchMedia(story);

      matchMedia.add(
        "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
        () => {
          gsap.utils
            .toArray<HTMLElement>("[data-scene]", story)
            .filter((scene) => !scene.closest(".journey-fallback"))
            .forEach((scene, index) => {
              const art = scene.querySelector<HTMLElement>("[data-art]");
              const content = scene.querySelector<HTMLElement>("[data-reveal]");
              const timeline = gsap.timeline({
                scrollTrigger: {
                  trigger: scene,
                  start: "top top+=72",
                  end: "+=65%",
                  pin: true,
                  pinSpacing: true,
                  scrub: 1,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                },
              });

              if (art) {
                const artKind = art.dataset.artKind;
                if (artKind === "truck" || artKind === "plane") {
                  timeline.fromTo(
                    art,
                    { x: () => -window.innerWidth * 0.35 },
                    {
                      x: () => window.innerWidth * 0.35,
                      ease: "none",
                    },
                    0,
                  );
                } else if (artKind === "ship") {
                  timeline.fromTo(art, { x: 80 }, { x: -80, ease: "none" }, 0);
                } else {
                  timeline.fromTo(
                    art,
                    { xPercent: index % 2 === 0 ? 18 : -18 },
                    { xPercent: 0, ease: "none" },
                    0,
                  );
                }
              }

              if (content) {
                timeline.fromTo(content, { y: 24 }, { y: 0, ease: "none" }, 0);
              }
            });
        },
      );

      ScrollTrigger.refresh();

      cancelActiveMode = () => {
        matchMedia.revert();
      };
    };

    applyAnimationMode();
    mobileQuery.addEventListener("change", applyAnimationMode);
    reducedMotionQuery.addEventListener("change", applyAnimationMode);

    return () => {
      mobileQuery.removeEventListener("change", applyAnimationMode);
      reducedMotionQuery.removeEventListener("change", applyAnimationMode);
      cancelActiveMode();
    };
  }, []);

  return null;
}

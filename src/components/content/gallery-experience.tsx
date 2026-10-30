"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import type { PublicGalleryItem } from "@/lib/public-content";

export function GalleryExperience({ items }: { items: PublicGalleryItem[] }) {
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  const filteredItems = items.filter(
    (item) => category === "All" || item.category === category,
  );
  const activeItem =
    activeIndex === null ? null : (filteredItems[activeIndex] ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeItem && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (!activeItem && dialog.open) {
      dialog.close();
    }
  }, [activeItem]);

  function showPrevious() {
    setActiveIndex((index) =>
      index === null
        ? null
        : (index - 1 + filteredItems.length) % filteredItems.length,
    );
  }

  function showNext() {
    setActiveIndex((index) =>
      index === null ? null : (index + 1) % filteredItems.length,
    );
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Tab") {
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      );
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDialogElement>) {
    const touch = event.changedTouches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDialogElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > 0) showPrevious();
    else showNext();
  }

  return (
    <>
      <div
        aria-label="Filter gallery by category"
        className="flex flex-wrap gap-2"
        role="group"
      >
        {categories.map((itemCategory) => (
          <button
            aria-pressed={category === itemCategory}
            className="min-h-11 rounded-full border border-blue-200 px-4 text-sm font-semibold text-blue-900 aria-pressed:bg-blue-800 aria-pressed:text-white"
            key={itemCategory}
            onClick={() => {
              setActiveIndex(null);
              setCategory(itemCategory);
            }}
            type="button"
          >
            {itemCategory}
          </button>
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => (
          <figure
            className="border-border bg-card overflow-hidden rounded-2xl border"
            key={`${item.src}-${item.title}`}
          >
            <button
              aria-label={`View ${item.title}`}
              className="block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt={item.alt}
                className="aspect-[3/2] w-full object-cover"
                height={item.height}
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl}
                preload={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                src={item.src}
                unoptimized
                width={item.width}
              />
            </button>
            <figcaption className="px-5 py-4">
              <h2 className="font-semibold">{item.title}</h2>
              {item.caption && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.caption}
                </p>
              )}
              <p className="mt-3 text-xs font-bold tracking-wide text-blue-700 uppercase">
                {item.category}
              </p>
            </figcaption>
          </figure>
        ))}
        {filteredItems.length === 0 && (
          <p className="rounded-xl border p-5 text-slate-600">
            No gallery images are available in this category.
          </p>
        )}
      </div>

      <dialog
        aria-label="Gallery image viewer"
        className="m-auto max-h-[92dvh] w-[min(96vw,72rem)] max-w-none rounded-2xl bg-slate-950 p-3 text-white shadow-2xl backdrop:bg-black/80 sm:p-5"
        onClose={() => setActiveIndex(null)}
        onKeyDown={handleDialogKeyDown}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
        ref={dialogRef}
        tabIndex={-1}
      >
        {activeItem && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm font-semibold">
                {activeItem.title} · {(activeIndex ?? 0) + 1} of{" "}
                {filteredItems.length}
              </p>
              <button
                className="min-h-11 rounded-lg border border-white/40 px-4 font-semibold hover:bg-white/10"
                onClick={() => dialogRef.current?.close()}
                ref={closeButtonRef}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
              <button
                aria-label="Previous image"
                className="z-10 min-h-11 min-w-11 rounded-full border border-white/40 font-bold hover:bg-white/10"
                onClick={showPrevious}
                type="button"
              >
                <span aria-hidden="true">←</span>
              </button>
              <Image
                alt={activeItem.alt}
                className="max-h-[70dvh] w-full rounded-lg object-contain"
                height={activeItem.height}
                placeholder={activeItem.blurDataUrl ? "blur" : "empty"}
                blurDataURL={activeItem.blurDataUrl}
                sizes="96vw"
                src={activeItem.src}
                unoptimized
                width={activeItem.width}
              />
              <button
                aria-label="Next image"
                className="z-10 min-h-11 min-w-11 rounded-full border border-white/40 font-bold hover:bg-white/10"
                onClick={showNext}
                type="button"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
            {activeItem.caption && (
              <p className="text-center text-sm text-white/85">
                {activeItem.caption}
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

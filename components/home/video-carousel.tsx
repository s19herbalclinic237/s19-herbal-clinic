"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { StoryVideo } from "@/components/testimonials/story-video";
import { useLocale } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export interface HomeVideoItem {
  url: string;
  title?: string;
  blocked: boolean;
}

/**
 * Horizontal snap-scroll carousel for patient video reviews on the home page.
 * Scrolls one card at a time with the edge arrow buttons; on touch devices
 * visitors swipe the track natively. Arrow buttons auto-disable at the ends.
 */
export function VideoCarousel({ items }: { items: HomeVideoItem[] }) {
  const { t } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const card = el.firstElementChild as HTMLElement | null;
    return (card?.offsetWidth ?? el.clientWidth * 0.82) + 16; // + gap-4
  }, []);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * step(), behavior: "smooth" });
  };

  const arrowClasses =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-forest-950/80 text-white shadow-lift backdrop-blur-sm transition hover:border-gold-400 hover:bg-gold-400 hover:text-forest-950 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="mt-12">
      <div className="relative">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
        >
          {items.map((item, i) => (
            <div
              key={`${item.url}-${i}`}
              className="w-[82%] shrink-0 snap-start sm:w-[400px]"
            >
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-forest-900/50 shadow-lift">
                <StoryVideo url={item.url} blocked={item.blocked} bare />
              </div>
              {item.title ? (
                <p className="mt-3.5 text-sm font-semibold leading-snug text-white">
                  {item.title}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          disabled={!canLeft}
          aria-label={t("home.videos.prev")}
          className={cn(arrowClasses, "-left-1 md:-left-4")}
        >
          <FaChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          disabled={!canRight}
          aria-label={t("home.videos.next")}
          className={cn(arrowClasses, "-right-1 md:-right-4")}
        >
          <FaChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const START_EVENT = "s19:route-change-start";
const MAX_WAIT_MS = 6000;

/**
 * Slim branded progress bar shown at the very top of the viewport while the
 * App Router transitions between pages. The bar starts the moment a route
 * change is dispatched (instrumentation-client) and finishes when the new
 * pathname commits — with a fallback timeout so it always clears.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const startedPath = useRef<string | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    startedPath.current = pathname;
    setDone(false);
    setActive(true);

    if (failTimer.current) clearTimeout(failTimer.current);
    failTimer.current = setTimeout(() => {
      // Fallback: navigation stalled or completed without a pathname change
      setDone(true);
      setTimeout(() => setActive(false), 300);
    }, MAX_WAIT_MS);
  }, [pathname]);

  const finish = useCallback(() => {
    if (failTimer.current) clearTimeout(failTimer.current);
    setDone(true);
    setTimeout(() => setActive(false), 260);
  }, []);

  useEffect(() => {
    const onStart = (e: Event) => {
      void e;
      start();
    };
    window.addEventListener(START_EVENT, onStart);
    return () => window.removeEventListener(START_EVENT, onStart);
  }, [start]);

  useEffect(() => {
    if (active && startedPath.current !== null && startedPath.current !== pathname) {
      finish();
    }
  }, [pathname, active, finish]);

  useEffect(() => {
    return () => {
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="route-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px]"
          aria-hidden
        >
          <motion.div
            className="h-full rounded-r-full bg-gradient-to-r from-forest-700 via-forest-500 to-gold-400 shadow-[0_0_10px_rgba(212,180,71,0.45)]"
            animate={{ width: done ? "100%" : "72%" }}
            transition={
              done
                ? { duration: 0.22, ease: "easeOut" }
                : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
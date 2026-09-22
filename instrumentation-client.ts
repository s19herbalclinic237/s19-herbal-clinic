/**
 * Client instrumentation (Next.js 16 App Router).
 *
 * Observes route transitions and broadcasts a DOM event so the
 * <RouteProgress> bar can give instant feedback during navigation.
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse"
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("s19:route-change-start", { detail: { url, navigationType } })
  );
}
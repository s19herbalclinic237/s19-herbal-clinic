import { SiteLoader } from "@/components/ui/site-loader";

/**
 * Root route-streaming fallback: shown while a page is being server-rendered
 * or during client transitions, then swapped for the finished content.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[55vh] w-full items-center justify-center px-4 py-16">
      <SiteLoader />
    </div>
  );
}
import Link from "next/link";
import { buttonLinkClasses } from "@/components/ui/button";
import { FaLeaf } from "react-icons/fa6";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <FaLeaf className="h-10 w-10 text-forest-300" aria-hidden />
      <p className="mt-6 font-serif text-6xl font-semibold text-forest-900">404</p>
      <h1 className="mt-3 text-2xl">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonLinkClasses("primary", "lg")}>Back to Home</Link>
        <Link href="/shop" className={buttonLinkClasses("secondary", "lg")}>Browse the Catalog</Link>
      </div>
    </div>
  );
}
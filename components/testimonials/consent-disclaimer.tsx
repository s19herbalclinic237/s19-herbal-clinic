import { serverT } from "@/lib/i18n-server";
import { FaLock } from "react-icons/fa6";

/**
 * Patient video testimonials show a real person. Permission to publish someone
 * is a different question from whether their result is typical, so this block
 * is deliberately separate from the results disclaimer and is rendered on
 * every page that puts a patient video in front of a visitor.
 *
 * Four points, in the clinic's own wording:
 *   1. Every video was shared with the patient's consent.
 *   2. Taking part is optional and changes nothing about their care.
 *   3. Anyone who would rather stay private is not published.
 *   4. Nothing goes out without the patient's authorisation.
 */
export async function ConsentDisclaimer() {
  const t = await serverT();

  const points = [
    t("stories.consent.p1"),
    t("stories.consent.p2"),
    t("stories.consent.p3"),
    t("stories.consent.p4"),
  ];

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-line bg-white p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-50">
          <FaLock className="h-4 w-4 text-forest-700" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("stories.consent.title")}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-400"
                  aria-hidden
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
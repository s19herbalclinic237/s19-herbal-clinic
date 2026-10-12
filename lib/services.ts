import "server-only";

import { connectDb } from "@/lib/db";
import { Service, type IService } from "@/lib/models/Service";
import { treatmentPrograms } from "@/lib/data/programs";
import type { TreatmentProgram } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

let dbUnavailable = false;

function toTreatmentProgram(s: IService): TreatmentProgram {
  return {
    slug: s.slug,
    title: s.title,
    short: s.short,
    detail: s.detail,
    conditions: Array.isArray(s.conditions) ? s.conditions.filter(Boolean) : [],
    note: s.note || undefined,
    noteKind:
      s.noteKind === "safety" ? "safety" : s.noteKind === "important" ? "important" : undefined,
    titleFr: s.titleFr || undefined,
    shortFr: s.shortFr || undefined,
    detailFr: s.detailFr || undefined,
    conditionsFr: Array.isArray(s.conditionsFr)
      ? s.conditionsFr.filter(Boolean)
      : undefined,
    noteFr: s.noteFr || undefined,
  };
}

function localize(p: TreatmentProgram, locale: Locale): TreatmentProgram {
  if (locale !== "fr") return { ...p };
  return {
    slug: p.slug,
    title: p.titleFr ?? p.title,
    short: p.shortFr ?? p.short,
    detail: p.detailFr ?? p.detail,
    conditions: p.conditionsFr ?? p.conditions,
    note: p.noteFr ?? p.note,
    noteKind: p.noteKind,
  };
}

function staticServices(): TreatmentProgram[] {
  return treatmentPrograms.map((p) => ({ ...p }));
}

/**
 * Copies the built-in services into the database the first time the
 * collection is empty, so the admin panel opens with the eleven services that
 * used to be hard-coded rather than an empty list.
 *
 * Upserts by slug so a concurrent request cannot create duplicates.
 */
export async function seedServicesIfEmpty(): Promise<void> {
  const conn = await connectDb();
  if (!conn) return;
  try {
    const count = await Service.estimatedDocumentCount();
    if (count > 0) return;
    await Service.bulkWrite(
      treatmentPrograms.map((p, index) => ({
        updateOne: {
          filter: { slug: p.slug },
          update: {
            $setOnInsert: {
              slug: p.slug,
              title: p.title,
              short: p.short,
              detail: p.detail,
              conditions: p.conditions,
              note: p.note,
              noteKind: p.noteKind ?? "important",
              order: index,
              status: "published" as const,
              publishedAt: new Date(),
              titleFr: p.titleFr,
              shortFr: p.shortFr,
              detailFr: p.detailFr,
              conditionsFr: p.conditionsFr,
              noteFr: p.noteFr,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  } catch (error) {
    console.error("[services] seed failed:", error);
  }
}

/** Published services in display order, falling back to the built-in list. */
export async function getServices(): Promise<TreatmentProgram[]> {
  if (dbUnavailable) return staticServices();
  const conn = await connectDb();
  if (!conn) {
    dbUnavailable = true;
    return staticServices();
  }
  try {
    const docs = await Service.find({ status: "published" })
      .sort({ order: 1, createdAt: 1 })
      .lean<IService[]>();
    if (!docs.length) return staticServices();
    return docs.map(toTreatmentProgram);
  } catch {
    dbUnavailable = true;
    return staticServices();
  }
}

export async function getLocalizedServices(locale: Locale): Promise<TreatmentProgram[]> {
  const services = await getServices();
  return services.map((s) => localize(s, locale));
}

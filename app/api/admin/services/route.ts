import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Service, type ServiceStatus } from "@/lib/models/Service";
import { seedServicesIfEmpty } from "@/lib/services";
import { slugify } from "@/lib/slug";

function cleanConditions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => String(c ?? "").trim())
    .filter((c) => c.length > 0)
    .slice(0, 12);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Services are temporarily unavailable." }, { status: 503 });
  }

  try {
    // First run: copy the built-in services so the panel is never empty.
    await seedServicesIfEmpty();
    const services = await Service.find().sort({ order: 1, createdAt: 1 }).limit(200).lean();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("[admin/services] list failed:", error);
    return NextResponse.json({ error: "Could not load services." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const short = String(body.short || "").trim();
  const detail = String(body.detail || "").trim();
  const conditions = cleanConditions(body.conditions);

  if (title.length < 2 || title.length > 160) {
    return NextResponse.json({ error: "Please provide a title." }, { status: 400 });
  }
  if (short.length < 20 || short.length > 600) {
    return NextResponse.json({ error: "Please provide a summary (20-600 characters)." }, { status: 400 });
  }
  if (detail.length < 20 || detail.length > 4000) {
    return NextResponse.json({ error: "Please provide the full description (20-4000 characters)." }, { status: 400 });
  }
  if (conditions.length < 1) {
    return NextResponse.json({ error: "Add at least one 'Supports' item." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the service." }, { status: 503 });
  }

  const slug = slugify(String(body.slug || "").trim() || title);
  const status: ServiceStatus = body.status === "draft" ? "draft" : "published";
  const noteKind = body.noteKind === "safety" ? "safety" : "important";
  const note = String(body.note || "").trim();

  try {
    const exists = await Service.exists({ slug });
    if (exists) {
      return NextResponse.json({ error: "A service with that slug already exists." }, { status: 409 });
    }

    let order: number;
    if (typeof body.order === "number" && Number.isFinite(body.order)) {
      order = Math.trunc(body.order);
    } else {
      const last = await Service.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
      order = (last?.order ?? -1) + 1;
    }

    const titleFr = String(body.titleFr || "").trim();
    const shortFr = String(body.shortFr || "").trim();
    const detailFr = String(body.detailFr || "").trim();
    const noteFr = String(body.noteFr || "").trim();

    const service = await Service.create({
      slug,
      title,
      short,
      detail,
      conditions,
      note: note || undefined,
      noteKind,
      order,
      status,
      publishedAt: status === "published" ? new Date() : undefined,
      titleFr: titleFr || undefined,
      shortFr: shortFr || undefined,
      detailFr: detailFr || undefined,
      conditionsFr: cleanConditions(body.conditionsFr),
      noteFr: noteFr || undefined,
    });
    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    console.error("[admin/services] create failed:", error);
    return NextResponse.json({ error: "Could not save the service." }, { status: 500 });
  }
}

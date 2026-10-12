import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { Service } from "@/lib/models/Service";
import { slugify } from "@/lib/slug";

function cleanConditions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => String(c ?? "").trim())
    .filter((c) => c.length > 0)
    .slice(0, 12);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid service id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not save the service." }, { status: 503 });
  }

  const existing = await Service.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (title.length < 2 || title.length > 160) {
      return NextResponse.json({ error: "Please provide a title." }, { status: 400 });
    }
    patch.title = title;
  }

  if (body.short !== undefined) {
    const short = String(body.short).trim();
    if (short.length < 20 || short.length > 600) {
      return NextResponse.json({ error: "Please provide a summary (20-600 characters)." }, { status: 400 });
    }
    patch.short = short;
  }

  if (body.detail !== undefined) {
    const detail = String(body.detail).trim();
    if (detail.length < 20 || detail.length > 4000) {
      return NextResponse.json({ error: "Please provide the full description (20-4000 characters)." }, { status: 400 });
    }
    patch.detail = detail;
  }

  if (body.conditions !== undefined) {
    const conditions = cleanConditions(body.conditions);
    if (conditions.length < 1) {
      return NextResponse.json({ error: "Add at least one 'Supports' item." }, { status: 400 });
    }
    patch.conditions = conditions;
  }

  if (body.conditionsFr !== undefined) {
    patch.conditionsFr = cleanConditions(body.conditionsFr);
  }

  if (body.note !== undefined) {
    patch.note = String(body.note).trim() || null;
  }

  if (body.noteKind !== undefined) {
    patch.noteKind = String(body.noteKind) === "safety" ? "safety" : "important";
  }

  if (body.slug !== undefined) {
    const slug = slugify(String(body.slug).trim() || String(existing.title));
    if (slug && slug !== existing.slug) {
      const exists = await Service.exists({ slug, _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ error: "A service with that slug already exists." }, { status: 409 });
      }
    }
    if (slug) patch.slug = slug;
  }

  if (body.titleFr !== undefined) patch.titleFr = String(body.titleFr).trim() || null;
  if (body.shortFr !== undefined) patch.shortFr = String(body.shortFr).trim() || null;
  if (body.detailFr !== undefined) patch.detailFr = String(body.detailFr).trim() || null;
  if (body.noteFr !== undefined) patch.noteFr = String(body.noteFr).trim() || null;

  if (body.order !== undefined) {
    const order = Number(body.order);
    if (Number.isFinite(order)) patch.order = Math.trunc(order);
  }

  if (body.status !== undefined) {
    const status = String(body.status) === "draft" ? "draft" : "published";
    patch.status = status;
    if (status === "published" && existing.status !== "published") {
      patch.publishedAt = new Date();
    }
  }

  try {
    const service = await Service.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("[admin/services] update failed:", error);
    return NextResponse.json({ error: "Could not save the service." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid service id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Could not delete the service." }, { status: 503 });
  }

  try {
    const deleted = await Service.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/services] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the service." }, { status: 500 });
  }
}

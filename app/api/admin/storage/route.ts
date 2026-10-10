import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { connectDb } from "@/lib/db";
import { getCloudinary } from "@/lib/cloudinary";

interface MongoStorage {
  ok: boolean;
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  objectCount: number;
  collections: number;
  /** Operator-declared plan quota, or null when none is configured. */
  limitBytes: number | null;
}

interface CloudinaryStorage {
  ok: boolean;
  plan?: string;
  storage: number;
  storageLimit: number | null;
  bandwidth: number;
  bandwidthLimit: number | null;
  transformation: number;
  transformationLimit: number | null;
  objects: number;
  credits: number | null;
}

interface UsageNumber {
  usage?: number;
  limit?: number;
}

interface CloudinaryUsage {
  plan?: string;
  credits?: { usage?: number };
  storage?: UsageNumber | number;
  bandwidth?: UsageNumber | number;
  transformations?: UsageNumber | number;
  objects?: UsageNumber | number;
  resources?: number;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Cloudinary returns some counters as `{ usage, limit }` objects and others as
 *  bare numbers depending on plan, so unwrap either shape. */
function meter(value: UsageNumber | number | undefined): { usage: number; limit: number | null } {
  if (typeof value === "number") return { usage: num(value), limit: null };
  return { usage: num(value?.usage), limit: num(value?.limit) || null };
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  let mongo: MongoStorage | { ok: false; error: string };
  let cloudinary: CloudinaryStorage | { ok: false; error?: string; message?: string };

  // MongoDB stats. The driver exposes no plan quota, so operators may declare
  // one with MONGO_STORAGE_LIMIT_GB (e.g. 0.5 for an Atlas 512 MB tier).
  try {
    const conn = await connectDb();
    const db = conn?.connection?.db;
    if (!db) {
      mongo = { ok: false, error: "No database connection." };
    } else {
      const stats = await db.stats();
      const limitGb = Number(process.env.MONGO_STORAGE_LIMIT_GB);
      mongo = {
        ok: true,
        dataSize: num(stats.dataSize),
        storageSize: num(stats.storageSize),
        indexSize: num(stats.indexSize),
        totalSize: num(stats.dataSize) + num(stats.indexSize),
        objectCount: num(stats.objects),
        collections: num(stats.collections),
        limitBytes:
          Number.isFinite(limitGb) && limitGb > 0 ? Math.round(limitGb * 1024 * 1024 * 1024) : null,
      };
    }
  } catch (error) {
    console.error("[admin/storage] mongo failed:", error);
    mongo = { ok: false, error: (error as Error).message };
  }

  // Cloudinary usage.
  try {
    const cloud = getCloudinary();
    if (!cloud) {
      cloudinary = { ok: false, message: "Cloudinary is not configured." };
    } else {
      const usage = (await cloud.api.usage()) as CloudinaryUsage;
      const storage = meter(usage.storage);
      const bandwidth = meter(usage.bandwidth);
      const transformations = meter(usage.transformations);
      cloudinary = {
        ok: true,
        plan: usage.plan,
        storage: storage.usage,
        storageLimit: storage.limit,
        bandwidth: bandwidth.usage,
        bandwidthLimit: bandwidth.limit,
        transformation: transformations.usage,
        transformationLimit: transformations.limit,
        objects: meter(usage.objects).usage || num(usage.resources),
        credits: typeof usage.credits?.usage === "number" ? usage.credits.usage : null,
      };
    }
  } catch (error) {
    console.error("[admin/storage] cloudinary failed:", error);
    cloudinary = { ok: false, error: (error as Error).message };
  }

  return NextResponse.json({ mongo, cloudinary });
}

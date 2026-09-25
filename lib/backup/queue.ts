import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { connectDb } from "@/lib/db";
import { BackupRun, type BackupTrigger } from "@/lib/models/BackupRun";
import { BackupLease } from "@/lib/models/BackupLease";

const TERMINAL_STATES = new Set(["succeeded", "failed"] as const);

export interface EnqueueBackupInput {
  trigger: BackupTrigger;
  scheduledFor?: Date;
  requestedBy?: string;
  reason?: string;
  idempotencyKey?: string;
}

function runIdempotencyKey(input: EnqueueBackupInput): string {
  if (input.idempotencyKey?.trim()) {
    const scope = input.requestedBy || "global";
    return `${input.trigger}:${scope}:${input.idempotencyKey.trim()}`;
  }
  if (input.trigger === "scheduled" && input.scheduledFor) {
    return `scheduled:${input.scheduledFor.toISOString().slice(0, 13)}`;
  }
  return `${input.trigger}:${randomUUID()}`;
}

export async function enqueueBackup(input: EnqueueBackupInput) {
  const conn = await connectDb();
  if (!conn) throw new Error("Database is unavailable");
  const logicalRunId = runIdempotencyKey(input);
  return BackupRun.findOneAndUpdate(
    { logicalRunId },
    {
      $setOnInsert: {
        logicalRunId,
        attempt: 1,
        state: "queued",
        trigger: input.trigger,
        scheduledFor: input.scheduledFor,
        requestedBy: input.requestedBy,
        requestReason: input.reason?.trim().slice(0, 300),
        collectionCount: 0,
        documentCount: 0,
        assetCount: 0,
        originalCount: 0,
        originalBytes: 0,
        transportVerified: false,
        notificationStatus: "pending",
        restoreTestStatus: "not-tested",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function recoverExpiredBackupRuns(): Promise<number> {
  const conn = await connectDb();
  if (!conn) throw new Error("Database is unavailable");
  const now = new Date();
  const result = await BackupRun.updateMany(
    {
      state: { $nin: [...TERMINAL_STATES] },
      leaseExpiresAt: { $exists: true, $lte: now },
    },
    {
      $set: {
        state: "queued",
        stage: "worker-recovery",
        errorCode: "LEASE_EXPIRED",
        errorStage: "worker",
      },
      $inc: { attempt: 1 },
      $unset: { leaseOwner: 1, leaseExpiresAt: 1, startedAt: 1 },
    }
  );
  if (result.modifiedCount > 0) {
    await BackupLease.updateMany(
      { expiresAt: { $lte: now } },
      { $unset: { currentRun: 1 } }
    );
  }
  return result.modifiedCount;
}

async function acquireGlobalLease(owner: string): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60_000);
  try {
    const lease = await BackupLease.findOneAndUpdate(
      {
        _id: "global",
        $or: [{ expiresAt: { $lte: now } }, { owner }],
      },
      { $set: { owner, expiresAt }, $unset: { currentRun: 1 } },
      { upsert: true, new: true }
    ).lean();
    return lease?.owner === owner;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}

async function releaseGlobalLease(owner: string): Promise<void> {
  await BackupLease.updateOne(
    { _id: "global", owner },
    { $set: { expiresAt: new Date(0) }, $unset: { currentRun: 1 } }
  );
}

export async function claimNextBackup(owner = `${hostname()}:${randomUUID()}`) {
  const conn = await connectDb();
  if (!conn) throw new Error("Database is unavailable");
  if (!(await acquireGlobalLease(owner))) return null;

  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + 60_000);
  const run = await BackupRun.findOneAndUpdate(
    { state: "queued" },
    {
      $set: {
        state: "running",
        stage: "claimed",
        leaseOwner: owner,
        leaseExpiresAt,
        startedAt: now,
      },
    },
    { sort: { createdAt: 1 }, new: true }
  ).lean();
  if (!run) {
    await releaseGlobalLease(owner);
    return null;
  }
  await BackupLease.updateOne(
    { _id: "global", owner },
    { $set: { currentRun: run._id }, $setOnInsert: { owner } }
  );
  return { run, owner };
}

export async function renewBackupLease(runId: string, owner: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    BackupRun.updateOne(
      { _id: runId, leaseOwner: owner, state: { $nin: [...TERMINAL_STATES] } },
      { $set: { leaseExpiresAt: new Date(now.getTime() + 60_000) } }
    ),
    BackupLease.updateOne(
      { _id: "global", owner, currentRun: runId },
      { $set: { expiresAt: new Date(now.getTime() + 60_000) } }
    ),
  ]);
}

export async function releaseBackupLease(runId: string, owner: string): Promise<void> {
  await releaseGlobalLease(owner);
  await BackupRun.updateOne(
    { _id: runId, leaseOwner: owner },
    { $unset: { leaseOwner: 1, leaseExpiresAt: 1 } }
  );
}

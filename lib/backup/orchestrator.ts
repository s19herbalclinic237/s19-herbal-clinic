import { Encrypter } from "age-encryption";
import { type S3Client } from "@aws-sdk/client-s3";
import { BSON, EJSON, type Timestamp } from "bson";
import { v2 as cloudinary } from "cloudinary";
import { createHash, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import {
  PassThrough,
  Readable,
  Transform,
  type Readable as NodeReadable,
} from "node:stream";
import { finished, pipeline } from "node:stream/promises";
import mongoose, { type Connection } from "mongoose";
import type { Db } from "mongodb";
import * as tar from "tar-stream";
import { backupConfigurationErrors, type BackupConfig } from "@/lib/backup/config";
import { notifyBackupOutcome } from "@/lib/backup/notifications";
import { createBackupS3Client, tagBackupObject, uploadBackupObject } from "@/lib/backup/storage";
import { BackupRun } from "@/lib/models/BackupRun";
import { releaseBackupLease, renewBackupLease } from "@/lib/backup/queue";

const FORMAT = "s19-backup/v1";
const LEASE_REFRESH_MS = 45_000;

type ArchiveFile = {
  path: string;
  bytes: number;
  sha256: string;
};

type CloudinaryAsset = {
  asset_id?: string;
  public_id: string;
  resource_type: "image" | "video" | "raw" | string;
  type: string;
  version?: number;
  format?: string;
  bytes?: number;
  folder?: string;
  created_at?: string;
  uploaded_at?: string;
  tags?: string[];
  context?: Record<string, unknown>;
  width?: number;
  height?: number;
  duration?: number;
  secure_url?: string;
  [key: string]: unknown;
};

type CloudinaryInventoryRecord = Record<string, unknown> & {
  archivePath: string;
  sha256: string;
  bytes: number;
};

class HashMeter extends Transform {
  readonly hash = createHash("sha256");
  bytes = 0;

  _transform(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Buffer) => void
  ) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    this.bytes += buffer.length;
    this.hash.update(buffer);
    callback(null, buffer);
  }

  digest(): string {
    return this.hash.copy().digest("hex");
  }
}

function safeJson(value: unknown): string {
  return EJSON.stringify(value, { relaxed: false });
}

function objectKeyFor(backupId: string, attempt: number): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "/");
  return `backups/v1/${date}/${backupId}/${attempt}/bundle.tar.age`;
}

async function writeArchiveEntry(input: {
  pack: tar.Pack;
  path: string;
  size: number;
  source: NodeReadable;
}): Promise<ArchiveFile> {
  const meter = new HashMeter();
  let callbackError: Error | null = null;
  const entry = input.pack.entry(
    {
      name: input.path,
      size: input.size,
      mode: 0o600,
      mtime: new Date(0),
      type: "file",
    },
    (error) => {
      if (error && !callbackError) callbackError = error;
    }
  );
  await Promise.all([
    pipeline(input.source, meter, entry),
    finished(entry).catch((error: Error) => {
      callbackError ||= error;
    }),
  ]);
  if (callbackError) throw callbackError;
  return { path: input.path, bytes: meter.bytes, sha256: meter.digest() };
}

function bufferEntry(buffer: Buffer): NodeReadable {
  return Readable.from(buffer.length === 0 ? [] : [buffer]);
}

async function setRunState(
  runId: string,
  owner: string,
  state: BackupRunState,
  extra: Record<string, unknown> = {}
): Promise<void> {
  await BackupRun.updateOne(
    { _id: runId, leaseOwner: owner },
    { $set: { state, ...extra } }
  );
  await renewBackupLease(runId, owner);
}

type BackupRunState =
  | "running"
  | "capturing-mongo"
  | "capturing-cloudinary"
  | "building-manifest"
  | "encrypting"
  | "uploading"
  | "transport-verified"
  | "notifying"
  | "succeeded"
  | "failed";

async function captureMongo(input: {
  connection: Connection;
  pack: tar.Pack;
  maxCollectionBytes: number;
  runId: string;
  owner: string;
}) {
  const db = input.connection.db;
  if (!db) throw new Error("MongoDB connection has no database");

  const ping = await db.admin().command({ ping: 1 });
  const clusterTime = (ping.operationTime ?? ping.$clusterTime?.clusterTime) as
    | Timestamp
    | undefined;
  if (!clusterTime) throw new Error("MongoDB did not return a cluster timestamp");

  const before = await listApplicationCollections(db);
  const catalogEntries: Array<Record<string, unknown>> = [];
  const files: ArchiveFile[] = [];
  let documentCount = 0;

  for (const [index, info] of before.entries()) {
    await setRunState(input.runId, input.owner, "capturing-mongo", {
      stage: `mongo-collection-${index + 1}-of-${before.length}`,
    });
    const name = info.name;
    if (info.type !== "collection") {
      throw new Error(`Unsupported MongoDB collection type for ${name}: ${info.type}`);
    }
    const collection = db.collection(name);
    const bsonChunks: Buffer[] = [];
    const ejsonChunks: Buffer[] = [];
    let collectionBytes = 0;
    let capturedDocuments = 0;
    const readConcern = { level: "snapshot", atClusterTime: clusterTime } as const;
    const cursor = collection.find(
      {},
      { readConcern, noCursorTimeout: true } as Record<string, unknown>
    );

    for await (const document of cursor) {
      const bson = BSON.serialize(document as BSON.Document);
      const ejson = Buffer.from(`${safeJson(document)}\\n`, "utf8");
      bsonChunks.push(Buffer.from(bson));
      ejsonChunks.push(ejson);
      collectionBytes += bson.length + ejson.length;
      capturedDocuments += 1;
      if (collectionBytes > input.maxCollectionBytes) {
        throw new Error(
          `MongoDB collection ${name} exceeded the configured in-memory capture limit`
        );
      }
    }

    const ordinal = String(index + 1).padStart(4, "0");
    const bsonPath = `s19-backup/v1/mongo/collections/${ordinal}.bson`;
    const ejsonPath = `s19-backup/v1/mongo/collections/${ordinal}.ejson.ndjson`;
    const bsonBuffer = Buffer.concat(bsonChunks);
    const ejsonBuffer = Buffer.concat(ejsonChunks);
    const bsonFile = await writeArchiveEntry({
      pack: input.pack,
      path: bsonPath,
      size: bsonBuffer.length,
      source: bufferEntry(bsonBuffer),
    });
    const ejsonFile = await writeArchiveEntry({
      pack: input.pack,
      path: ejsonPath,
      size: ejsonBuffer.length,
      source: bufferEntry(ejsonBuffer),
    });
    files.push(bsonFile, ejsonFile);
    documentCount += capturedDocuments;
    catalogEntries.push({
      ordinal,
      name,
      type: info.type,
      options: info.options ?? {},
      info: info.info ?? {},
      idIndex: info.idIndex ?? null,
      approximateDocumentCount: Number(info.count ?? 0),
      capturedDocumentCount: capturedDocuments,
      capturedBytes: bsonBuffer.length + ejsonBuffer.length,
      structuralFingerprint: createHash("sha256")
        .update(safeJson({ type: info.type, options: info.options ?? {}, info: info.info ?? {}, idIndex: info.idIndex ?? null }))
        .digest("hex"),
    });
  }

  const after = await listApplicationCollections(db);
  if (safeJson(before) !== safeJson(after)) {
    throw new Error("MongoDB collection structure changed during backup capture");
  }

  return {
    database: db.databaseName,
    clusterTime,
    collectionCount: before.length,
    documentCount,
    catalogEntries,
    files,
  };
}

async function listApplicationCollections(db: Db) {
  const all = await db.listCollections({}, { nameOnly: false }).toArray();
  return all
    .filter((entry) => !entry.name.startsWith("system."))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function configureCloudinary(config: BackupConfig) {
  if (config.cloudinary.url) {
    const parsed = new URL(config.cloudinary.url);
    if (parsed.protocol !== "cloudinary:") {
      throw new Error("BACKUP_CLOUDINARY_URL must use the cloudinary: scheme");
    }
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      secure: true,
    });
    return;
  }
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

async function listCloudinaryAssets(config: BackupConfig): Promise<CloudinaryAsset[]> {
  configureCloudinary(config);
  const assets = new Map<string, CloudinaryAsset>();
  for (const resourceType of ["image", "video", "raw"]) {
    for (const type of ["upload", "private", "authenticated"]) {
      for (const prefix of config.cloudinaryPrefixes) {
        let nextCursor: string | undefined;
        do {
          const response = (await cloudinary.api.resources({
            resource_type: resourceType,
            type,
            prefix,
            max_results: 500,
            ...(nextCursor ? { next_cursor: nextCursor } : {}),
          })) as { resources?: CloudinaryAsset[]; next_cursor?: string };
          for (const asset of response.resources ?? []) {
            if (!asset.public_id) continue;
            const key = [
              asset.resource_type || resourceType,
              asset.type || type,
              asset.public_id,
              asset.version ?? "",
            ].join(":");
            assets.set(key, asset);
          }
          nextCursor = response.next_cursor;
        } while (nextCursor);
      }
    }
  }
  return [...assets.values()].sort((a, b) =>
    `${a.resource_type}:${a.type}:${a.public_id}`.localeCompare(
      `${b.resource_type}:${b.type}:${b.public_id}`
    )
  );
}

function cloudinaryOriginalUrl(asset: CloudinaryAsset): string {
  const options = {
    resource_type: asset.resource_type,
    type: asset.type,
    version: asset.version,
    format: asset.format,
    secure: true,
  } as Record<string, unknown>;
  if (asset.type === "private" || asset.type === "authenticated") {
    options.sign_url = true;
  }
  return cloudinary.url(asset.public_id, options);
}

async function captureCloudinary(input: {
  config: BackupConfig;
  pack: tar.Pack;
  runId: string;
  owner: string;
}) {
  const assets = await listCloudinaryAssets(input.config);
  const inventory: CloudinaryInventoryRecord[] = [];
  const files: ArchiveFile[] = [];
  let originalBytes = 0;

  for (const [index, asset] of assets.entries()) {
    await setRunState(input.runId, input.owner, "capturing-cloudinary", {
      stage: `cloudinary-asset-${index + 1}-of-${assets.length}`,
    });
    const response = await fetch(cloudinaryOriginalUrl(asset), {
      redirect: "follow",
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok || !response.body) {
      throw new Error(
        `Cloudinary original download failed with status ${response.status} for asset ${index + 1}`
      );
    }
    const expectedBytes = Number(response.headers.get("content-length") || asset.bytes || 0);
    if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0) {
      throw new Error(`Cloudinary asset ${index + 1} has no reliable original byte length`);
    }
    const archivePath = `s19-backup/v1/cloudinary/originals/${String(index + 1).padStart(6, "0")}.bin`;
    const file = await writeArchiveEntry({
      pack: input.pack,
      path: archivePath,
      size: expectedBytes,
      source: Readable.fromWeb(response.body as import("node:stream/web").ReadableStream<Uint8Array>),
    });
    if (file.bytes !== expectedBytes) {
      throw new Error(`Cloudinary asset ${index + 1} changed during backup capture`);
    }
    files.push(file);
    originalBytes += file.bytes;
    inventory.push({
      assetId: asset.asset_id,
      publicId: asset.public_id,
      resourceType: asset.resource_type,
      deliveryType: asset.type,
      version: asset.version,
      format: asset.format,
      folder: asset.folder,
      createdAt: asset.created_at,
      uploadedAt: asset.uploaded_at,
      tags: asset.tags,
      context: asset.context,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      secureUrl: asset.secure_url,
      archivePath,
      sha256: file.sha256,
      bytes: file.bytes,
    });
  }

  const inventoryBuffer = Buffer.from(
    inventory.map((record) => `${safeJson(record)}\\n`).join(""),
    "utf8"
  );
  const inventoryFile = await writeArchiveEntry({
    pack: input.pack,
    path: "s19-backup/v1/cloudinary/inventory.ndjson",
    size: inventoryBuffer.length,
    source: bufferEntry(inventoryBuffer),
  });
  files.push(inventoryFile);
  return { assets, files, inventory, originalBytes };
}

async function captureBackup(input: {
  config: BackupConfig;
  pack: tar.Pack;
  connection: Connection;
  runId: string;
  owner: string;
}) {
  const formatFile = await writeArchiveEntry({
    pack: input.pack,
    path: "s19-backup/v1/format.json",
    size: 0,
    source: bufferEntry(Buffer.from("{}")),
  });
  const mongo = await captureMongo({
    connection: input.connection,
    pack: input.pack,
    maxCollectionBytes: input.config.maxCollectionMemoryBytes,
    runId: input.runId,
    owner: input.owner,
  });
  const cloudinary = await captureCloudinary({
    config: input.config,
    pack: input.pack,
    runId: input.runId,
    owner: input.owner,
  });
  const catalog = {
    format: FORMAT,
    database: mongo.database,
    clusterTime: mongo.clusterTime,
    collections: mongo.catalogEntries,
  };
  const catalogBuffer = Buffer.from(safeJson(catalog), "utf8");
  const catalogFile = await writeArchiveEntry({
    pack: input.pack,
    path: "s19-backup/v1/mongo/catalog.ejson",
    size: catalogBuffer.length,
    source: bufferEntry(catalogBuffer),
  });
  return {
    files: [formatFile, ...mongo.files, ...cloudinary.files, catalogFile],
    mongo,
    cloudinary,
  };
}

function buildManifest(input: {
  backupId: string;
  logicalRunId: string;
  attempt: number;
  createdAt: Date;
  config: BackupConfig;
  mongo: Awaited<ReturnType<typeof captureMongo>>;
  cloudinary: Awaited<ReturnType<typeof captureCloudinary>>;
  files: ArchiveFile[];
  checksumsSha256: string;
}) {
  return {
    format: FORMAT,
    backupId: input.backupId,
    logicalRunId: input.logicalRunId,
    attempt: input.attempt,
    createdAt: input.createdAt.toISOString(),
    source: {
      mongo: {
        database: input.mongo.database,
        clusterTime: input.mongo.clusterTime,
      },
      cloudinary: {
        prefixes: input.config.cloudinaryPrefixes,
        originalsIncluded: true,
      },
    },
    mongo: {
      collectionCount: input.mongo.collectionCount,
      documentCount: input.mongo.documentCount,
    },
    cloudinary: {
      assetCount: input.cloudinary.assets.length,
      originalCount: input.cloudinary.inventory.length,
      originalBytes: input.cloudinary.originalBytes,
    },
    files: input.files,
    checksumsSha256: input.checksumsSha256,
    encryption: {
      format: "age",
      recipientFingerprints: input.config.ageRecipients,
    },
  };
}

export async function runBackup(input: {
  runId: string;
  owner?: string;
  config?: BackupConfig;
}): Promise<void> {
  const owner = input.owner || `${hostname()}:${randomUUID()}`;
  const config = input.config || (await import("@/lib/backup/config")).getBackupConfig();
  const errors = backupConfigurationErrors(config);
  if (errors.length > 0) throw new Error(errors.join("; "));

  const run = await BackupRun.findById(input.runId).lean();
  if (!run) throw new Error("Backup run not found");
  const backupId = run._id;
  const objectKey = objectKeyFor(backupId, run.attempt);
  const startedAt = run.startedAt || new Date();
  let stage = "initializing";
  let sourceConnection: Connection | null = null;
  let s3: S3Client | null = null;
  let completed = false;
  let heartbeat: NodeJS.Timeout | undefined;

  try {
    s3 = createBackupS3Client(config);
    sourceConnection = await mongoose
      .createConnection(process.env.BACKUP_MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || "", {
        serverSelectionTimeoutMS: 15_000,
        maxPoolSize: 2,
      })
      .asPromise();
    if (!sourceConnection.db) throw new Error("Backup MongoDB connection has no database");

    await setRunState(input.runId, owner, "encrypting", { stage, startedAt });
    stage = "encrypting";
    const pack = tar.pack();
    const packWeb = Readable.toWeb(pack as unknown as import("node:stream").Readable) as ReadableStream<Uint8Array>;
    const encrypter = new Encrypter();
    for (const recipient of config.ageRecipients) encrypter.addRecipient(recipient);
    const encrypted = await encrypter.encrypt(packWeb);
    const encryptedNode = Readable.fromWeb(
      encrypted as unknown as import("node:stream/web").ReadableStream<Uint8Array>
    );
    const cipherMeter = new HashMeter();
    const sink = new PassThrough({ highWaterMark: 1024 * 1024 });
    encryptedNode.on("error", (error) => sink.destroy(error));
    const cipherPipeline = pipeline(encryptedNode, cipherMeter, sink);
    const retainUntil = new Date(
      Date.now() + config.s3.retentionDays * 24 * 60 * 60 * 1000
    );
    const uploadPromise = uploadBackupObject({
      client: s3,
      config,
      objectKey,
      body: sink,
      retainUntil,
    });
    heartbeat = setInterval(() => {
      void renewBackupLease(input.runId, owner).catch(() => undefined);
    }, LEASE_REFRESH_MS);
    heartbeat.unref?.();

    const captured = await captureBackup({
      config,
      pack,
      connection: sourceConnection,
      runId: input.runId,
      owner,
    });
    stage = "building-manifest";
    await setRunState(input.runId, owner, "building-manifest", { stage });

    const checksumLines = captured.files
      .map((file) => `${file.sha256}  ${file.path}`)
      .join("\\n");
    const checksumBuffer = Buffer.from(
      `${checksumLines}${checksumLines ? "\\n" : ""}`,
      "utf8"
    );
    const checksumsFile = await writeArchiveEntry({
      pack,
      path: "s19-backup/v1/checksums.sha256",
      size: checksumBuffer.length,
      source: bufferEntry(checksumBuffer),
    });
    const manifest = buildManifest({
      backupId,
      logicalRunId: run.logicalRunId,
      attempt: run.attempt,
      createdAt: new Date(),
      config,
      mongo: captured.mongo,
      cloudinary: captured.cloudinary,
      files: [...captured.files, checksumsFile],
      checksumsSha256: checksumsFile.sha256,
    });
    const manifestBytes = Buffer.from(safeJson(manifest), "utf8");
    const manifestFile = await writeArchiveEntry({
      pack,
      path: "s19-backup/v1/manifest.json",
      size: manifestBytes.length,
      source: bufferEntry(manifestBytes),
    });
    await BackupRun.updateOne(
      { _id: input.runId, leaseOwner: owner },
      {
        $set: {
          state: "uploading",
          stage: "uploading",
          objectKey,
          manifestSha256: manifestFile.sha256,
          collectionCount: captured.mongo.collectionCount,
          documentCount: captured.mongo.documentCount,
          assetCount: captured.cloudinary.assets.length,
          originalCount: captured.cloudinary.inventory.length,
          originalBytes: captured.cloudinary.originalBytes,
        },
      }
    );
    await renewBackupLease(input.runId, owner);
    pack.finalize();
    await cipherPipeline;
    stage = "uploading";
    const uploaded = await uploadPromise;
    clearInterval(heartbeat);
    if (cipherMeter.bytes !== uploaded.contentLength) {
      throw new Error("Backup ciphertext length did not match uploaded object length");
    }
    if (cipherMeter.bytes > config.maxObjectBytes) {
      throw new Error("Backup ciphertext exceeded BACKUP_MAX_OBJECT_BYTES");
    }
    const ciphertextSha256 = cipherMeter.digest();
    const latest = await BackupRun.findById(input.runId).lean();
    if (!latest) throw new Error("Backup run disappeared during upload");
    await setRunState(input.runId, owner, "transport-verified", {
      stage: "transport-verified",
      ciphertextSha256,
      ciphertextBytes: cipherMeter.bytes,
      transportVerified: true,
    });
    await tagBackupObject({
      client: s3,
      config,
      objectKey,
      tags: {
        "backup-format": FORMAT,
        "backup-id": backupId,
        "ciphertext-sha256": ciphertextSha256,
        "ciphertext-bytes": String(cipherMeter.bytes),
        "manifest-sha256": manifestFile.sha256,
        "created-at": new Date().toISOString(),
      },
    });

    stage = "notifying";
    await setRunState(input.runId, owner, "notifying", { stage });
    const completedAt = new Date();
    const notificationStatus = await notifyBackupOutcome(config, {
      runId: backupId,
      state: "succeeded",
      trigger: run.trigger,
      startedAt,
      completedAt,
      collectionCount: captured.mongo.collectionCount,
      documentCount: captured.mongo.documentCount,
      assetCount: captured.cloudinary.assets.length,
      originalBytes: captured.cloudinary.originalBytes,
      ciphertextBytes: cipherMeter.bytes,
      ciphertextSha256,
      manifestSha256: manifestFile.sha256,
      transportVerified: true,
      restoreTestStatus: latest.restoreTestStatus,
    });
    await BackupRun.updateOne(
      { _id: input.runId, leaseOwner: owner },
      {
        $set: {
          state: "succeeded",
          stage: "complete",
          completedAt,
          notificationStatus,
          transportVerified: true,
        },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1, errorCode: 1, errorStage: 1 },
      }
    );
    completed = true;
  } catch (error) {
    clearInterval((globalThis as { __s19BackupHeartbeat?: NodeJS.Timeout }).__s19BackupHeartbeat);
    const errorCode = error instanceof Error ? error.name.slice(0, 80) : "BACKUP_ERROR";
    await BackupRun.updateOne(
      { _id: input.runId },
      {
        $set: {
          state: "failed",
          stage: "failed",
          completedAt: new Date(),
          errorCode,
          errorStage: stage.slice(0, 80),
          notificationStatus: "pending",
        },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1 },
      }
    );
    if (!completed) {
      try {
        const current = await BackupRun.findById(input.runId).lean();
        if (current) {
          await notifyBackupOutcome(config, {
            runId: backupId,
            state: "failed",
            trigger: run.trigger,
            startedAt,
            completedAt: new Date(),
            collectionCount: current.collectionCount,
            documentCount: current.documentCount,
            assetCount: current.assetCount,
            originalBytes: current.originalBytes,
            ciphertextBytes: current.ciphertextBytes,
            ciphertextSha256: current.ciphertextSha256,
            manifestSha256: current.manifestSha256,
            transportVerified: current.transportVerified,
            restoreTestStatus: current.restoreTestStatus,
            errorCode,
            errorStage: stage,
          });
        }
      } catch {
        // Notification failure must not obscure the original backup failure.
      }
    }
    throw error;
  } finally {
    await releaseBackupLease(input.runId, owner);
    await sourceConnection?.close().catch(() => undefined);
  }
}

export function _clearBackupHeartbeatForTests(): void {
  delete (globalThis as { __s19BackupHeartbeat?: NodeJS.Timeout }).__s19BackupHeartbeat;
}

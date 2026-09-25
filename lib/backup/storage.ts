import {
  HeadObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";
import type { BackupConfig } from "@/lib/backup/config";

export interface BackupObjectResult {
  versionId?: string;
  etag?: string;
  contentLength: number;
}

function clientConfig(config: BackupConfig): S3ClientConfig {
  const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;
  const sessionToken = process.env.BACKUP_S3_SESSION_TOKEN;
  return {
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: config.s3.forcePathStyle,
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          },
        }
      : {}),
  };
}

export function createBackupS3Client(config: BackupConfig): S3Client {
  return new S3Client(clientConfig(config));
}

export async function uploadBackupObject(input: {
  client: S3Client;
  config: BackupConfig;
  objectKey: string;
  body: Readable;
  retainUntil: Date;
}): Promise<BackupObjectResult> {
  const upload = new Upload({
    client: input.client,
    leavePartsOnError: false,
    params: {
      Bucket: input.config.s3.bucket,
      Key: input.objectKey,
      Body: input.body,
      ContentType: "application/octet-stream",
      ContentEncoding: "binary",
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: input.config.s3.kmsKeyId,
      ObjectLockMode: "COMPLIANCE",
      ObjectLockRetainUntilDate: input.retainUntil,
      ChecksumAlgorithm: "SHA256",
    },
  });

  await upload.done();
  const head = await input.client.send(
    new HeadObjectCommand({
      Bucket: input.config.s3.bucket,
      Key: input.objectKey,
    })
  );
  if (typeof head.ContentLength !== "number") {
    throw new Error("Backup storage did not return the uploaded object length");
  }
  return {
    versionId: head.VersionId,
    etag: head.ETag,
    contentLength: head.ContentLength,
  };
}

export async function tagBackupObject(input: {
  client: S3Client;
  config: BackupConfig;
  objectKey: string;
  tags: Record<string, string>;
}): Promise<void> {
  const tagSet = Object.entries(input.tags)
    .filter(([, value]) => Boolean(value))
    .map(([Key, Value]) => ({ Key, Value: String(Value) }));
  if (tagSet.length === 0) return;
  await input.client.send(
    new PutObjectTaggingCommand({
      Bucket: input.config.s3.bucket,
      Key: input.objectKey,
      Tagging: { TagSet: tagSet },
    })
  );
}

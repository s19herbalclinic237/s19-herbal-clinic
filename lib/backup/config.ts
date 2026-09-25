export interface BackupConfig {
  ageRecipients: string[];
  s3: {
    bucket: string;
    region: string;
    endpoint?: string;
    forcePathStyle: boolean;
    kmsKeyId: string;
    retentionDays: number;
  };
  cloudinaryPrefixes: string[];
  cloudinary: {
    url?: string;
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
  maxObjectBytes: number;
  maxCollectionMemoryBytes: number;
  alertEmails: string[];
  assetMode: "originals";
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function commaList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getBackupConfig(): BackupConfig {
  const ageRecipients = commaList(process.env.BACKUP_AGE_RECIPIENTS).filter((recipient) =>
    recipient.startsWith("age1")
  );
  const cloudinaryPrefixes = commaList(process.env.BACKUP_CLOUDINARY_PREFIXES);
  if (cloudinaryPrefixes.length === 0) {
    cloudinaryPrefixes.push(process.env.CLOUDINARY_FOLDER || "s19-medical");
  }

  const alertEmails = commaList(process.env.BACKUP_ALERT_EMAILS);
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail && !alertEmails.includes(adminEmail)) alertEmails.push(adminEmail);

  return {
    ageRecipients,
    cloudinaryPrefixes: [...new Set(cloudinaryPrefixes)],
    cloudinary: {
      url: process.env.BACKUP_CLOUDINARY_URL?.trim() || undefined,
      cloudName: process.env.BACKUP_CLOUDINARY_CLOUD_NAME?.trim() || undefined,
      apiKey: process.env.BACKUP_CLOUDINARY_API_KEY?.trim() || undefined,
      apiSecret: process.env.BACKUP_CLOUDINARY_API_SECRET?.trim() || undefined,
    },
    assetMode: "originals",
    maxObjectBytes: positiveInt(process.env.BACKUP_MAX_OBJECT_BYTES, 10 * 1024 * 1024 * 1024),
    maxCollectionMemoryBytes: positiveInt(
      process.env.BACKUP_MAX_COLLECTION_MEMORY_BYTES,
      512 * 1024 * 1024
    ),
    alertEmails,
    s3: {
      bucket: process.env.BACKUP_S3_BUCKET?.trim() || "",
      region: process.env.BACKUP_S3_REGION?.trim() || "us-east-1",
      endpoint: process.env.BACKUP_S3_ENDPOINT?.trim() || undefined,
      forcePathStyle: process.env.BACKUP_S3_FORCE_PATH_STYLE === "true",
      kmsKeyId: process.env.BACKUP_S3_KMS_KEY_ID?.trim() || "",
      retentionDays: positiveInt(process.env.BACKUP_RETENTION_DAYS, 35),
    },
  };
}

export function backupConfigurationErrors(config = getBackupConfig()): string[] {
  const errors: string[] = [];
  if (config.ageRecipients.length < 1) {
    errors.push("BACKUP_AGE_RECIPIENTS must contain at least one public age recipient");
  }
  if (!config.s3.bucket) errors.push("BACKUP_S3_BUCKET is required");
  if (!config.s3.region) errors.push("BACKUP_S3_REGION is required");
  if (!config.s3.kmsKeyId) errors.push("BACKUP_S3_KMS_KEY_ID is required");
  if (config.s3.retentionDays < 1) errors.push("BACKUP_RETENTION_DAYS must be at least 1");
  if (config.cloudinaryPrefixes.length === 0) {
    errors.push("At least one Cloudinary backup prefix is required");
  }
  if (
    !config.cloudinary.url &&
    !(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret)
  ) {
    errors.push(
      "BACKUP_CLOUDINARY_URL or BACKUP_CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET is required"
    );
  }
  if (config.alertEmails.length === 0) {
    errors.push("ADMIN_EMAIL or BACKUP_ALERT_EMAILS is required");
  }
  return errors;
}

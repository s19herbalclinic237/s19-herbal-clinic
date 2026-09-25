import { Schema, model, models, type Model } from "mongoose";

export type BackupTrigger = "scheduled" | "manual" | "cli" | "worker-retry";
export type BackupState =
  | "queued"
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
export type BackupNotificationStatus = "pending" | "sent" | "failed" | "not-configured";
export type BackupRestoreTestStatus = "not-tested" | "passed" | "failed";

export interface IBackupRun {
  _id: string;
  logicalRunId: string;
  attempt: number;
  state: BackupState;
  trigger: BackupTrigger;
  scheduledFor?: Date;
  requestedBy?: string;
  requestReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  leaseOwner?: string;
  leaseExpiresAt?: Date;
  stage?: string;
  objectKey?: string;
  ciphertextSha256?: string;
  ciphertextBytes?: number;
  manifestSha256?: string;
  collectionCount: number;
  documentCount: number;
  assetCount: number;
  originalCount: number;
  originalBytes: number;
  transportVerified: boolean;
  notificationStatus: BackupNotificationStatus;
  restoreTestStatus: BackupRestoreTestStatus;
  restoreTestedAt?: Date;
  errorCode?: string;
  errorStage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BackupRunSchema = new Schema<IBackupRun>(
  {
    logicalRunId: { type: String, required: true, unique: true, trim: true },
    attempt: { type: Number, required: true, min: 1, default: 1 },
    state: {
      type: String,
      enum: [
        "queued",
        "running",
        "capturing-mongo",
        "capturing-cloudinary",
        "building-manifest",
        "encrypting",
        "uploading",
        "transport-verified",
        "notifying",
        "succeeded",
        "failed",
      ],
      default: "queued",
      required: true,
    },
    trigger: {
      type: String,
      enum: ["scheduled", "manual", "cli", "worker-retry"],
      required: true,
    },
    scheduledFor: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    requestReason: { type: String, trim: true, maxlength: 300 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    leaseOwner: { type: String, trim: true },
    leaseExpiresAt: { type: Date },
    stage: { type: String, trim: true, maxlength: 80 },
    objectKey: { type: String, trim: true, maxlength: 700 },
    ciphertextSha256: { type: String, trim: true },
    ciphertextBytes: { type: Number, min: 0 },
    manifestSha256: { type: String, trim: true },
    collectionCount: { type: Number, min: 0, default: 0 },
    documentCount: { type: Number, min: 0, default: 0 },
    assetCount: { type: Number, min: 0, default: 0 },
    originalCount: { type: Number, min: 0, default: 0 },
    originalBytes: { type: Number, min: 0, default: 0 },
    transportVerified: { type: Boolean, default: false },
    notificationStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "not-configured"],
      default: "pending",
    },
    restoreTestStatus: {
      type: String,
      enum: ["not-tested", "passed", "failed"],
      default: "not-tested",
    },
    restoreTestedAt: { type: Date },
    errorCode: { type: String, trim: true, maxlength: 80 },
    errorStage: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

BackupRunSchema.index({ state: 1, leaseExpiresAt: 1, createdAt: 1 });
BackupRunSchema.index({ scheduledFor: -1, state: 1 });
BackupRunSchema.index({ requestedBy: 1, createdAt: -1 });

export const BackupRun: Model<IBackupRun> =
  (models.BackupRun as Model<IBackupRun>) ||
  model<IBackupRun>("BackupRun", BackupRunSchema);

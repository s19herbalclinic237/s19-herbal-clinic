import { Schema, model, models, type Model } from "mongoose";

export interface IBackupLease {
  _id: string;
  owner: string;
  currentRun?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BackupLeaseSchema = new Schema<IBackupLease>(
  {
    _id: { type: String, default: "global" },
    owner: { type: String, required: true, trim: true },
    currentRun: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const BackupLease: Model<IBackupLease> =
  (models.BackupLease as Model<IBackupLease>) ||
  model<IBackupLease>("BackupLease", BackupLeaseSchema);

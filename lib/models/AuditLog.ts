import { Schema, model, models, type Model } from "mongoose";

export interface IAuditLog {
  _id: string;
  /** Id of the clinic user who performed the action. */
  actorId: string;
  actorName?: string;
  /** Stable machine-readable action, e.g. "mrn.assigned", "mrn.changed", "mrn.removed". */
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  /** Human-readable summary of what changed, e.g. "MRN S1900614 -> S1900615". */
  details?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true },
    actorName: { type: String },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, default: "user" },
    targetId: { type: String, required: true, index: true },
    targetLabel: { type: String },
    details: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ targetId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>("AuditLog", AuditLogSchema);

/** Records an audit entry even if the collection momentarily fails (best-effort). */
export async function recordAudit(entry: {
  actorId: string;
  actorName?: string;
  action: string;
  targetId: string;
  targetLabel?: string;
  details?: string;
}): Promise<void> {
  try {
    await AuditLog.create({ ...entry, targetType: "user" });
  } catch (error) {
    console.error("[audit] failed to record:", { entry, error });
  }
}
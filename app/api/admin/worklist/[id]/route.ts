import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { getCurrentUser } from "@/lib/auth-server";
import { recordAppLog } from "@/lib/app-log";
import { getWorklistItem, applyWorklistAction, WORKLIST_ACTIONS, type WorklistAction } from "@/lib/worklist-db";

const MAX_NOTE = 2000;

/**
 * Record a staff decision about one worklist alert: claim it, release it,
 * resolve it, dismiss it, reopen it, or leave a note.
 *
 * Keyed by the alert id rather than a database id, because the alert is
 * recomputed from clinical data on every read and has no row of its own until
 * someone acts on it.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The worklist is temporarily unavailable." }, { status: 503 });
  }

  const { id } = await context.params;
  const alertId = decodeURIComponent(id);

  let body: { action?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = body.action as WorklistAction | undefined;
  if (!action || !WORKLIST_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${WORKLIST_ACTIONS.join(", ")}.` },
      { status: 400 }
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() : undefined;
  if (note !== undefined && note.length > MAX_NOTE) {
    return NextResponse.json({ error: `Note must be ${MAX_NOTE} characters or fewer.` }, { status: 400 });
  }
  if (action === "note" && !note) {
    return NextResponse.json({ error: "A note cannot be empty." }, { status: 400 });
  }

  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Clinician access required." }, { status: 403 });
  }

  try {
    const now = new Date();
    // Identity columns are read from the existing row where there is one, so an
    // action taken before the row exists still carries the patient reference.
    const existing = await getWorklistItem(alertId);

    const state = await applyWorklistAction({
      alertId,
      action,
      actorId: actor.id,
      actorName: actor.name,
      note,
      now,
      category: existing?.category,
      planId: existing?.planId,
      patientId: existing?.patientId,
      patientName: existing?.patientName,
    });

    if (!state) {
      return NextResponse.json({ error: "Nothing to record." }, { status: 400 });
    }

    await recordAppLog({
      scope: "admin.worklist",
      level: "info",
      message: `worklist ${action}`,
      context: JSON.stringify({
        alertId,
        action,
        actor: actor.id,
        // `state.patientId`, not `state.ownerId` — the latter is the clinician
        // who acted, and logging it here recorded a staff id as a patient id.
        patientId: state.patientId ?? null,
        ownerId: state.ownerId ?? null,
      }),
    });

    return NextResponse.json({ item: state });
  } catch (error) {
    console.error("[admin worklist action] failed:", error);
    return NextResponse.json({ error: "Could not record that action." }, { status: 500 });
  }
}
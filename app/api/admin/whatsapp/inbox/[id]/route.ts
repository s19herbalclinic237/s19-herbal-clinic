import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { Conversation } from "@/lib/models/Conversation";
import { WhatsAppMessage } from "@/lib/models/WhatsAppMessage";
import { isServiceWindowOpen } from "@/lib/whatsapp-inbound";

/** Longest thread returned in one read. Enough to read a conversation, bounded so
 *  an unopened thread cannot pull an entire year of messages into a browser. */
const THREAD_LIMIT = 200;

type Params = { params: Promise<{ id: string }> };

/**
 * One conversation, oldest first, with its messages.
 *
 * Read-only apart from clearing the unread flag. M1 never composes and never
 * sends, so there is deliberately no `body` to write here - see the note on the
 * inbox index route.
 *
 * The response includes whether Meta's 24-hour free-form window is currently
 * open. Not because M1 can act on it, but because it is the single fact M2 will
 * need, and surfacing it now means the number is visible and checkable before
 * anything is allowed to depend on it.
 */
export async function GET(_request: Request, { params }: Params) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The WhatsApp inbox is temporarily unavailable." }, { status: 503 });
  }

  const conversation = await Conversation.findById(id).populate("patient", "name email").lean();
  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const messages = await WhatsAppMessage.find({ conversation: id })
    .sort({ occurredAt: 1 })
    .limit(THREAD_LIMIT)
    .lean();

  return NextResponse.json({
    id: String(conversation._id),
    phone: conversation.phone,
    patient: conversation.patient
      ? {
          id: String((conversation.patient as { _id: string })._id),
          name: (conversation.patient as { name?: string }).name ?? "",
          email: (conversation.patient as { email?: string }).email ?? "",
        }
      : null,
    displayName: conversation.displayName ?? "",
    windowExpiresAt: conversation.windowExpiresAt ?? null,
    optedOut: conversation.optedOut ?? null,
    // The safe direction: no stored expiry, or an unparseable one, reads as
    // closed. Anything else would invite M2 to send free-form text to a patient
    // with no basis for it.
    serviceWindowOpen: isServiceWindowOpen(
      conversation.windowExpiresAt ?? null,
      Date.now()
    ),
    lastStatus: conversation.lastStatus ?? "",
    messages: messages.map((message) => ({
      id: String(message._id),
      direction: message.direction,
      kind: message.kind,
      text: message.text ?? "",
      payload: message.payload ?? "",
      mediaId: message.mediaId ?? "",
      intent: message.intent ?? "",
      template: message.template ?? "",
      status: message.status ?? "",
      statusDetail: message.statusDetail ?? "",
      occurredAt: message.occurredAt,
    })),
  });
}

/** Clears the unread and attention flags on one thread. */
export async function PATCH(_request: Request, { params }: Params) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The WhatsApp inbox is temporarily unavailable." }, { status: 503 });
  }

  const result = await Conversation.updateOne(
    { _id: id },
    { $set: { unread: 0, needsAttention: false } }
  );

  if (!result.matchedCount) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ cleared: true });
}

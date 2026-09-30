import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { Conversation } from "@/lib/models/Conversation";

/**
 * The WhatsApp inbox: every conversation the clinic's number has received.
 *
 * ## Why this exists at all
 *
 * M1 is the module that makes replies possible. Before it, a patient who replied
 * to an automated message was shouting into a void - Meta delivered the reply
 * nowhere and it was discarded.
 *
 * The obvious mistake in fixing that is to build the webhook and stop. A webhook
 * that stores messages nobody reads is not a fix; it is a slower way of losing
 * them, because the clinic's own WhatsApp Business App is not connected to this
 * number and staff would have no idea a thread existed. So M1 has to end at
 * somewhere a human can see it, or M1 has not fixed anything.
 *
 * That is also why `needsAttention` is set on almost everything M1 records: a
 * free-text message from a patient, an unrecognised button, an unknown sender,
 * someone asking for a person. M1 answers nobody, so almost everything that
 * arrives is something a person should read.
 *
 * ## What is deliberately not here
 *
 * No reply box. Sending free-form text requires the service-window state and the
 * clinic's consent position, and both are M2's business. A compose box here
 * would invite someone to type into a window the system has not checked.
 */
export async function GET(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The WhatsApp inbox is temporarily unavailable." }, { status: 503 });
  }

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "attention";

  const query =
    filter === "all"
      ? {}
      : filter === "unread"
        ? { unread: { $gt: 0 } }
        : { needsAttention: true };

  const conversations = await Conversation.find(query)
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .populate("patient", "name email")
    .lean();

  const totals = {
    attention: await Conversation.countDocuments({ needsAttention: true }),
    unread: await Conversation.countDocuments({ unread: { $gt: 0 } }),
    all: await Conversation.countDocuments({}),
  };

  return NextResponse.json({
    filter,
    totals,
    conversations: conversations.map((conversation) => ({
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
      lastMessageAt: conversation.lastMessageAt,
      preview: conversation.lastMessagePreview,
      lastInboundAt: conversation.lastInboundAt ?? null,
      lastOutboundAt: conversation.lastOutboundAt ?? null,
      windowExpiresAt: conversation.windowExpiresAt ?? null,
      unread: conversation.unread,
      needsAttention: conversation.needsAttention,
      // Surfaced rather than hidden: a member of staff replying by hand to
      // someone who pressed "stop these messages" is a consent failure, and the
      // only defence is that they were told.
      optedOut: conversation.optedOut ?? null,
      lastStatus: conversation.lastStatus ?? "",
    })),
  });
}

/** Marks every thread read. A bulk action rather than a per-thread one, because
 *  "I have looked at the inbox" is how a clinician actually clears it, and a
 *  button per row for that is friction with no benefit. */
export async function PATCH() {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "The WhatsApp inbox is temporarily unavailable." }, { status: 503 });
  }

  // `needsAttention` is cleared at the same time as `unread`. A thread staff have
  // read is a thread that has been dealt with, and leaving the flag set would
  // mean the attention queue only ever grows.
  const result = await Conversation.updateMany(
    { $or: [{ unread: { $gt: 0 } }, { needsAttention: true }] },
    { $set: { unread: 0, needsAttention: false } }
  );

  return NextResponse.json({ cleared: result.modifiedCount ?? 0 });
}

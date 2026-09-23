import "server-only";

import { Message } from "@/lib/models/Message";

/**
 * Sends a clinic message to a patient's inbox (starts a new thread) and
 * returns whether it was stored. Best-effort: callers keep succeeding even
 * if the notification cannot be saved.
 */
export async function notifyPatient(opts: {
  userId: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  const subject = opts.subject.slice(0, 120);
  const body = opts.body.slice(0, 5000);
  if (!opts.userId || subject.length < 2) return false;
  try {
    await Message.create({
      user: opts.userId,
      author: "admin",
      subject,
      body,
      read: false,
    });
    return true;
  } catch (error) {
    console.error("[notifyPatient] failed:", error);
    return false;
  }
}
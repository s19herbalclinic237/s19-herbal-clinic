/**
 * Honeypot bot-trap shared by public forms (contact, newsletter, testimonials,
 * login, register). Real users never see the hidden field, so any non-empty
 * value means an automated bot filled the form.
 *
 * Server routes should call `isBotRequest(body)` BEFORE doing any work and
 * silently no-op (return the same shape as a successful request) so bots can't
 * learn they were caught.
 */

export const BOT_FIELDS = ["website", "company", "fax", "homepage"] as const;

/** True when any honeypot field carries a non-empty value. */
export function isBotRequest(body: Record<string, unknown>): boolean {
  return BOT_FIELDS.some((field) => {
    const value = body[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}
export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Stand-in for a real transactional email provider (Resend, SES, Postmark,
 * etc). This MVP has no email service configured, so "sending" just logs the
 * link server-side — visible only in server logs, never returned in an API
 * response. Swap the body of this function for a real provider call before
 * launch; every caller already treats this as fire-and-forget.
 */
export async function sendMail(to: string, subject: string, bodyText: string): Promise<void> {
  console.log(`[mailer stand-in] To: ${to}\nSubject: ${subject}\n${bodyText}\n`);
}

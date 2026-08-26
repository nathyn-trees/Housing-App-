import { Resend } from "resend";

export const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Nearby <onboarding@resend.dev>";

function logToConsole(to: string, subject: string, bodyText: string): void {
  console.log(`[mailer stand-in] To: ${to}\nSubject: ${subject}\n${bodyText}\n`);
}

/**
 * Sends via Resend when RESEND_API_KEY is set; otherwise logs the message
 * server-side (visible only in server logs, never returned in an API
 * response) — a friendly stand-in for local dev with no email account
 * configured. The default `onboarding@resend.dev` sender only works for
 * Resend's own sandbox/testing; verify a real domain and set EMAIL_FROM
 * before relying on this for actual users.
 */
export async function sendMail(to: string, subject: string, bodyText: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logToConsole(to, subject, bodyText);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, text: bodyText });
  if (error) {
    console.error("[mailer] Resend send failed, falling back to console log:", error);
    logToConsole(to, subject, bodyText);
  }
}

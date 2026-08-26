const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Short, URL-friendly personal invite code (e.g. /invite/{code}). Collisions are astronomically unlikely at this scale, so callers don't need retry logic. */
export function generateInviteCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

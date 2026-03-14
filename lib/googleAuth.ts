import { google } from "googleapis";
import { cookies } from "next/headers";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Load tokens from the g_tokens cookie into the oauth2Client.
 * Falls back to the env refresh token if no cookie is set (dev convenience).
 * Call this at the start of any server action that needs Google API access.
 */
export async function loadTokensFromCookie() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("g_tokens")?.value;

  if (raw) {
    try {
      const tokens = JSON.parse(raw);
      oauth2Client.setCredentials(tokens);
      return true; // logged in via OAuth
    } catch {
      // malformed cookie — fall through to refresh token fallback
    }
  }

  // Fallback: use the hardcoded refresh token from .env (dev/testing only)
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
    return false; // using fallback, not a real user session
  }

  return false;
}
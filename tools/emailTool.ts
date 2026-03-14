import { google } from "googleapis";
import { oauth2Client, loadTokensFromCookie } from "@/lib/googleAuth";

/** Extract the plain-text body from a Gmail message payload (handles multipart). */
function extractBody(payload: any): string {
  if (!payload) return "";

  // Direct body data on this part
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // Recurse into parts — prefer text/plain, fall back to text/html
  if (payload.parts && Array.isArray(payload.parts)) {
    // First try plain text
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
    }
    // Then recurse (multipart/alternative, multipart/mixed, etc.)
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

/** Parse "Display Name <email@example.com>" → { name, email } */
function parseFrom(from: string | null | undefined): {
  fromName: string;
  fromEmail: string;
} {
  if (!from) return { fromName: "", fromEmail: "" };
  const match = from.match(/^(.*?)<([^>]+)>$/);
  if (match) {
    return {
      fromName: match[1].trim().replace(/^"|"$/g, ""),
      fromEmail: match[2].trim(),
    };
  }
  // Plain address with no display name
  return { fromName: from.trim(), fromEmail: from.trim() };
}

export async function getUnreadEmails() {
  await loadTokensFromCookie();
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread in:inbox newer_than:30d",
    maxResults: 20,
  });

  const messages = res.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full", // needed to get the full decoded body
      });

      const headers = fullMessage.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const date = headers.find((h) => h.name === "Date")?.value ?? "";
      const messageId = headers.find((h) => h.name === "Message-ID")?.value ?? "";
      const replyTo = headers.find((h) => h.name === "Reply-To")?.value ?? "";

      const { fromName, fromEmail } = parseFrom(from);

      // Prefer the full body; fall back to the snippet
      const rawBody = extractBody(fullMessage.data.payload);
      // Strip excessive whitespace and limit to 1 500 chars so the context window isn't blown
      const body = rawBody
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 1500);

      return {
        id: msg.id,
        messageId,     // original Message-ID header (for threading replies)
        from,          // raw "From" header — full string
        fromName,      // display name only
        fromEmail: replyTo ? parseFrom(replyTo).fromEmail : fromEmail, // prefer Reply-To
        subject,
        date,
        body: body || fullMessage.data.snippet?.replace(/[^\x20-\x7E]/g, "") || "",
      };
    })
  );

  return emails;
}
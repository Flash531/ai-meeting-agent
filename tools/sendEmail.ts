import { google } from "googleapis";
import { oauth2Client } from "@/lib/googleAuth";

// User's local timezone — update this if you're in a different zone
const USER_TIMEZONE = "Asia/Karachi"; // PKT = UTC+5

export async function sendEmail(
  to: string,
  subject: string,
  message: string,
  /** Optional: original Message-ID header for threading replies */
  inReplyTo?: string
) {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Build the RFC-2822 email
  const headers: string[] = [
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `To: ${to}`,
    `Subject: ${subject}`,
  ];

  // Add threading headers so this appears as a reply in the same thread
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const rawEmail = [...headers, "", message].join("\r\n");

  const encodedMessage = Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return {
    status: "sent",
    id: res.data.id,
    to,
    subject,
  };
}
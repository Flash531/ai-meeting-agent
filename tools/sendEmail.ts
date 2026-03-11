

import { google } from "googleapis";
import { oauth2Client } from "@/lib/googleAuth";

export async function sendEmail(
  to: string,
  subject: string,
  message: string
) {
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });

  const email = [
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
    message
  ].join("\n");

  const encodedMessage = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage
    }
  });

  return {
    status: "sent",
    id: res.data.id
  };
}
import { google } from "googleapis";
import { oauth2Client } from "@/lib/googleAuth";

export async function getUnreadEmails() {

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });

  // get list of unread messages
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults: 5
  });

  const messages = res.data.messages || [];

  // fetch details for each message
  const emails = await Promise.all(
    messages.map(async (msg) => {

      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!
      });

      const headers = fullMessage.data.payload?.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value;
      const from = headers.find(h => h.name === "From")?.value;

      return {
        id: msg.id,
        from,
        subject,
        snippet: fullMessage.data.snippet?.replace(/[^\x20-\x7E]/g, "")
      };
    })
  );

  return emails;
}
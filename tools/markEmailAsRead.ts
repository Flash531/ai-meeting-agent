

import { google } from "googleapis";
import { oauth2Client, loadTokensFromCookie } from "@/lib/googleAuth";

export async function markEmailAsRead(messageId: string) {
  await loadTokensFromCookie();
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"]
    }
  });

  return {
    status: "marked_as_read",
    id: messageId
  };
}
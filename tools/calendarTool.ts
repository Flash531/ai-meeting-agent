import { google } from "googleapis";
import { oauth2Client } from "@/lib/googleAuth";

export async function getCalendarEvents() {

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
  });

  const now = new Date();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime"
  });

  const events = res.data.items || [];

  return events.map(event => ({
    title: event.summary,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date
  }));
}
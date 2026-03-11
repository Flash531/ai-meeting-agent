import { google } from "googleapis";
import { oauth2Client } from "@/lib/googleAuth";

export async function createCalendarEvent(
  title: string,
  startTime: string,
  endTime: string
) {

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client
  });

  // Convert provided times to proper Date objects
  const start = new Date(startTime);
  const end = new Date(endTime);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: {
        dateTime: start.toISOString()
      },
      end: {
        dateTime: end.toISOString()
      }
    }
  });

  return {
    message: "Calendar event created successfully",
    eventId: event.data.id
  };
}
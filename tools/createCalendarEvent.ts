import { google } from "googleapis";
import { oauth2Client, loadTokensFromCookie } from "@/lib/googleAuth";

const USER_TIMEZONE = "Asia/Kolkata"; // IST = UTC+5:30

export async function createCalendarEvent(
    title: string,
    startTime: string,
    endTime: string,
    description?: string,
    attendeeEmail?: string
) {
    await loadTokensFromCookie();
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const requestBody: any = {
        summary: title,
        description: description || "",
        start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: USER_TIMEZONE,
        },
        end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: USER_TIMEZONE,
        },
    };

    // Optionally invite the other person so it shows on their calendar too
    if (attendeeEmail) {
        requestBody.attendees = [{ email: attendeeEmail }];
        requestBody.sendUpdates = "all"; // send Google Calendar invite email
    }

    const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody,
    });

    return {
        status: "created",
        eventId: event.data.id,
        title,
        start: event.data.start?.dateTime,
        end: event.data.end?.dateTime,
        htmlLink: event.data.htmlLink,
    };
}
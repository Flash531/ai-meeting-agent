import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { getUnreadEmails } from "@/tools/emailTool";
import { getCalendarEvents } from "@/tools/calendarTool";
import { createCalendarEvent } from "@/tools/createCalendarEvent";
import { sendEmail } from "@/tools/sendEmail";
import { markEmailAsRead } from "@/tools/markEmailAsRead";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);

  const userPrompt =
    searchParams.get("prompt") ||
    "Check my unread emails";

  const result = await generateText({
    model: openai("gpt-4o-mini"),

    system: `
You are an AI scheduling assistant.

Your job is to:

1. Check unread emails using the Gmail tool.
2. Detect if any email contains a meeting request.
3. A meeting request usually contains phrases like:
   - "schedule a meeting"
   - "let's meet"
   - "call tomorrow"
   - "meeting at"
   - "available at"

4. Ignore job alerts, marketing emails, promotions.

5. If a meeting request exists:
   - say which email contains it
   - check the calendar using the calendar tool

6. If no meeting requests exist:
   - tell the user there are none.
`,

    tools: {
      getUnreadEmails: tool({
        description: "Fetch unread emails from Gmail",
        inputSchema: z.object({}),
        execute: async () => {
          return await getUnreadEmails();
        }
      }),

      getCalendarEvents: tool({
        description: "Fetch calendar events",
        inputSchema: z.object({}),
        execute: async () => {
          return await getCalendarEvents();
        }
      }),
      createCalendarEvent: tool({
        description: "Create a meeting event in Google Calendar",
        inputSchema: z.object({
          title: z.string(),
          startTime: z.string(),
          endTime: z.string()
        }),
        execute: async ({ title, startTime, endTime }) => {
          return await createCalendarEvent(title, startTime, endTime);
        }
      }),
      sendEmail: tool({
        description: "Send a confirmation email replying to the meeting request",
        inputSchema: z.object({
          to: z.string(),
          subject: z.string(),
          message: z.string()
        }),
        execute: async ({ to, subject, message }) => {
          return await sendEmail(to, subject, message);
        }
      }),
      markEmailAsRead: tool({
        description: "Mark a processed email as read so it isn't processed again",
        inputSchema: z.object({
          messageId: z.string()
        }),
        execute: async ({ messageId }) => {
          return await markEmailAsRead(messageId);
        }
      })
    },

    prompt: userPrompt
  });

  let finalText = result.text;

  if (!finalText && result.toolResults?.length) {

    const summary = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `
These are unread emails:

${JSON.stringify(result.toolResults?.[0]?.output)}

Your job:

1. Detect if any email contains a meeting request.
2. Extract the meeting time and day.

If a meeting request exists return JSON like:

{
  "meeting": true,
  "title": "Meeting from email",
  "time": "<time mentioned>",
  "day": "<day mentioned>"
}

If none exist return:

{
  "meeting": false
}
`
    });

    finalText = "";

    let meetingData;

    try {
      const clean = summary.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      meetingData = JSON.parse(clean);
    } catch {
      meetingData = null;
    }

    if (meetingData?.meeting) {

      const events = await getCalendarEvents();

      let availability: { available: boolean } | undefined;

      // If there are no events, the slot is automatically available
      if (!events || events.length === 0) {
        availability = { available: true };
      } else {
        const check = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: `
Existing calendar events:

${JSON.stringify(events)}

Requested meeting:
${JSON.stringify(meetingData)}

Check if the requested time conflicts with existing events.

Return JSON:
{
  "available": true
}

or

{
  "available": false
}
`
        });

        try {
          const clean = check.text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          availability = JSON.parse(clean);
        } catch {
          availability = { available: true };
        }

        if (availability?.available) {

          // Convert natural language time into a real datetime
          const now = new Date();

          let meetingDate = new Date(now);

          if (meetingData.day?.toLowerCase().includes("tomorrow")) {
            meetingDate.setDate(now.getDate() + 1);
          }

          // Parse time like "3 pm"
          let hours = 15; // default 3 PM
          let minutes = 0;

          if (meetingData.time) {
            const timeParsed = new Date(`1970-01-01 ${meetingData.time}`);

            if (!isNaN(timeParsed.getTime())) {
              hours = timeParsed.getHours();
              minutes = timeParsed.getMinutes();
            }
          }

          meetingDate.setHours(hours);
          meetingDate.setMinutes(minutes);
          meetingDate.setSeconds(0);

          const startISO = meetingDate.toISOString();

          // 30 minute meeting
          const endDate = new Date(meetingDate.getTime() + 30 * 60000);
          const endISO = endDate.toISOString();

          await createCalendarEvent(
            meetingData.title,
            startISO,
            endISO
          );

          const emailId = Array.isArray(result.toolResults?.[0]?.output)
            ? (result.toolResults?.[0]?.output as any[])[0]?.id
            : undefined;

          if (emailId) {
            await markEmailAsRead(emailId);
          }

          finalText = "Meeting scheduled successfully and email marked as read.";

        } else {

          finalText = "Requested meeting time conflicts with an existing calendar event.";

        }
      }
    }
  }

  return Response.json({
    text: finalText
  });
}
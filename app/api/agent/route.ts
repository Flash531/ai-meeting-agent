import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { getUnreadEmails } from "@/tools/emailTool";
import { getCalendarEvents } from "@/tools/calendarTool";
import { createCalendarEvent } from "@/tools/createCalendarEvent";
import { sendEmail } from "@/tools/sendEmail";
import { markEmailAsRead } from "@/tools/markEmailAsRead";

const TIMEZONE = "Asia/Kolkata"; // IST

export async function POST(req: Request) {
    const body = await req.json();

    const messages: { role: "user" | "assistant"; content: string }[] =
        body.messages || [];

    const now = new Date();
    const localTime = now.toLocaleString("en-US", {
        timeZone: TIMEZONE,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    // Capture buckets — populated by tool execute wrappers inside generateText
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailCapture: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meetingCapture: any[] = [];

    const agentResult = await generateText({
        model: openai.chat("gpt-4o-mini"),

        system: `
You are Aria, an autonomous AI scheduling assistant for Muhammad.
You manage his Gmail inbox and Google Calendar, taking real actions via tools.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Current date/time : ${localTime} (IST, Asia/Kolkata, UTC+5:30)
• User name         : Muhammad
• User timezone     : Asia/Kolkata (IST, UTC+5:30)
• All calendar times are in IST. When creating events, always pass ISO 8601 times with the +05:30 offset.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOOLS AND WHEN TO USE THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
getUnreadEmails       → Always call this first before any email-related action.
                        Returns: id, messageId, fromName, fromEmail, subject, date, body.
                        Use "fromEmail" for sending replies (never guess the address).
                        Use "messageId" in sendEmail's inReplyTo field to thread the reply.

getCalendarEvents     → Call this to check for scheduling conflicts.
                        Returns events with title, start, end in ISO format.

createCalendarEvent   → Call this when a time slot is confirmed free.
                        Pass times with "+05:30" offset (IST). Defaults to 1-hour meetings.
                        Pass attendeeEmail to send an automatic Google Calendar invite.

sendEmail             → Call this to send or reply to emails.
                        Always populate inReplyTo with the original messageId when replying.
                        Write warm, professional emails. Sign off as "Aria (Muhammad's AI assistant)".

markEmailAsRead       → Call this after processing any email (meeting or not).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When asked to check emails:
  1. getUnreadEmails
  2. For each email, decide: is it a MEETING REQUEST?
     (Look for dates, times, "meet", "call", "schedule", "zoom", "google meet",
      "available", "slot", "appointment", "book", "invite".)
  3. If YES → meeting request:
       a. getCalendarEvents
       b. Compare requested time to existing events.
       c. FREE  → createCalendarEvent (with attendeeEmail) → sendEmail (confirm, set inReplyTo) → markEmailAsRead
       d. BUSY  → sendEmail (politely decline, suggest 2 alternative slots) → markEmailAsRead
  4. If NO → briefly summarise the email, markEmailAsRead only if the user asked to clear it.

When asked to reply or respond to someone:
  1. Use fromEmail from conversation history — DO NOT ask the user for the email address if it was already shown.
  2. Immediately call sendEmail with inReplyTo = original messageId.
  3. Confirm: "✓ Replied to [fromName] at [fromEmail]."

When asked about calendar / schedule:
  1. getCalendarEvents and present events clearly with dates and times in IST.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ALWAYS call tools — never describe what you *would* do.
• Never hallucinate email addresses. Only use fromEmail returned by getUnreadEmails.
• Event times MUST include the +05:30 offset, e.g. 2026-03-28T10:00:00+05:30.
• If a meeting email is ambiguous about the time, ask Muhammad for confirmation before booking.
• Be concise. Avoid repeating the full email list if the user just wants action taken.
`,

        messages,

        tools: {
            getUnreadEmails: tool({
                description:
                    "Fetch Muhammad's unread Gmail emails. Returns: id, messageId, fromName, fromEmail, subject, date, and the full email body. Always call this first before any email action.",
                inputSchema: z.object({}),
                execute: async () => {
                    const emails = await getUnreadEmails();
                    emailCapture.push(...emails);
                    return emails;
                },
            }),

            getCalendarEvents: tool({
                description:
                    "Returns Muhammad's upcoming Google Calendar events (next 2 weeks). Each event has title, start, and end in ISO format. Call this to check for scheduling conflicts.",
                inputSchema: z.object({}),
                execute: async () => getCalendarEvents(),
            }),

            createCalendarEvent: tool({
                description:
                    "Creates a Google Calendar event for Muhammad. Times MUST be ISO 8601 with +05:00 offset (PKT). Pass attendeeEmail to automatically send a Google Calendar invite to the other person.",
                inputSchema: z.object({
                    title: z.string().describe("Meeting title, e.g. 'Google Meet with Farhan'"),
                    startTime: z
                        .string()
                        .describe("Start time in ISO 8601 with IST offset, e.g. 2026-03-28T10:00:00+05:30"),
                    endTime: z
                        .string()
                        .describe("End time in ISO 8601 with IST offset, e.g. 2026-03-28T11:00:00+05:30"),
                    description: z
                        .string()
                        .optional()
                        .describe("Optional: short description or agenda for the meeting"),
                    attendeeEmail: z
                        .string()
                        .optional()
                        .describe("Optional: email address of the other person, so they receive a calendar invite"),
                }),
                execute: async ({ title, startTime, endTime, description, attendeeEmail }) => {
                    const result = await createCalendarEvent(title, startTime, endTime, description, attendeeEmail);
                    meetingCapture.push(result);
                    return result;
                },
            }),

            sendEmail: tool({
                description:
                    "Send an email via Muhammad's Gmail. Always set inReplyTo to the original messageId when replying so it threads correctly in Gmail.",
                inputSchema: z.object({
                    to: z
                        .string()
                        .describe("Recipient email address — use fromEmail returned by getUnreadEmails, never guess"),
                    subject: z.string().describe("Email subject. Prefix with 'Re: ' when replying"),
                    message: z
                        .string()
                        .describe(
                            "Full email body in plain text. Be warm and professional. Sign off as: 'Aria (Muhammad\\'s AI assistant)'."
                        ),
                    inReplyTo: z
                        .string()
                        .optional()
                        .describe(
                            "The original email's messageId header — set this when replying so Gmail threads the message correctly"
                        ),
                }),
                execute: async ({ to, subject, message, inReplyTo }) =>
                    sendEmail(to, subject, message, inReplyTo),
            }),

            markEmailAsRead: tool({
                description:
                    "Mark a Gmail message as read. Always call this after processing a meeting-request email.",
                inputSchema: z.object({
                    messageId: z.string().describe("The Gmail message id (from getUnreadEmails 'id' field)"),
                }),
                execute: async ({ messageId }) => markEmailAsRead(messageId),
            }),
        },

        toolChoice: "auto",
        stopWhen: stepCountIs(15),
    });

    // ── Collect tool names used (for Activity panel) ──────────────────────
    // AI SDK v6 puts per-step data in agentResult.steps[]; the top-level
    // toolCalls is only the last step. Flatten all steps to get the full list.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSteps: any[] = (agentResult as any).steps ?? [];
    const allToolCalls: { toolName: string }[] = allSteps.length
        ? allSteps.flatMap((s: any) => s.toolCalls ?? [])
        : ((agentResult as any).toolCalls ?? []);

    // ── Extract email / meeting data from captured results ────────────────
    // We wrap each tool's execute so we can intercept its raw return value
    // rather than fighting whatever shape AI SDK puts in toolResults.
    const capturedEmails: any[] = emailCapture;
    const capturedMeetings: any[] = meetingCapture;

    // ── Build plain-English summary if the model produced no prose ────────
    let finalText = agentResult.text;

    if (!finalText) {
        const summaryParts: string[] = [];
        if (capturedEmails.length) summaryParts.push(`Found ${capturedEmails.length} unread email(s).`);
        if (capturedMeetings.length) {
            capturedMeetings.forEach((m: any) => {
                summaryParts.push(`Scheduled "${m.title}" on ${m.start ?? "TBD"}.`);
            });
        }
        if (summaryParts.length) finalText = summaryParts.join(" ");
    }

    const toolsUsed = [...new Set(allToolCalls.map((t) => t.toolName))].join(", ");

    // ── Shape emails for the frontend ─────────────────────────────────────
    const emailCards = capturedEmails.slice(0, 10).map((email: any, i: number) => {
        const name: string = email.fromName || email.fromEmail || "Unknown";
        const initials = name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
        const subjectLower = (email.subject ?? "").toLowerCase();
        const bodyLower = (email.body ?? "").toLowerCase();
        const isMeeting = ["meet","call","schedule","zoom","google meet","available","slot","appointment","book","invite","sync"]
            .some((kw) => subjectLower.includes(kw) || bodyLower.includes(kw));
        return {
            id: i + 1,
            sender: name,
            initials,
            subject: email.subject || "(No subject)",
            snippet: (email.body || "").slice(0, 120),
            time: email.date ? new Date(email.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
            tag: isMeeting ? "Meeting Request" : "Email",
        };
    });

    // ── Shape meetings for the frontend ───────────────────────────────────
    const meetingCards = capturedMeetings.map((ev: any, i: number) => {
        const start = ev.start ? new Date(ev.start) : null;
        const end   = ev.end   ? new Date(ev.end)   : null;
        const durationMin = (start && end) ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
        return {
            id: i + 1,
            title: ev.title,
            date: start ? start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
            time: start ? start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
            duration: durationMin ? `${durationMin} min` : "",
            attendee: ev.attendeeEmail ?? "",
            platform: "Google Meet",
        };
    });

    return Response.json({
        text: (finalText || "Done — no actions needed.") + (toolsUsed ? `\n\n_Tools used: ${toolsUsed}_` : ""),
        toolCalls: allToolCalls,
        emails: emailCards,
        meetings: meetingCards,
    });
}
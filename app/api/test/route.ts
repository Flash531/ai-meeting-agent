import { getUnreadEmails } from "@/tools/emailTool";
import { getCalendarEvents } from "@/tools/calendarTool";

export async function GET() {

  const emails = await getUnreadEmails();
  const events = await getCalendarEvents();

  return Response.json({
    emails,
    events
  });

}
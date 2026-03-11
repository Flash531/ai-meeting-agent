import { oauth2Client } from "@/lib/googleAuth";
import { NextResponse } from "next/server";

export async function GET() {

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
     prompt: "consent",   // IMPORTANT
    scope: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar"
    ]
  });

  return NextResponse.redirect(url);
}
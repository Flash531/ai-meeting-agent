import { oauth2Client } from "@/lib/googleAuth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({
        error: "Authorization code missing"
      });
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Set credentials for future API calls
    oauth2Client.setCredentials(tokens);

    console.log("Google OAuth Tokens:", tokens);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      tokens
    });

  } catch (error) {
    console.error("OAuth Error:", error);

    return NextResponse.json({
      error: "Authentication failed"
    });
  }
}
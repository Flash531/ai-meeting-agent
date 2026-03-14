import { NextResponse } from "next/server";

export async function GET() {
  // Clear the session cookie
  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.cookies.set("g_tokens", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0, // expires immediately
    path: "/",
  });
  res.cookies.set("g_profile", "", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}

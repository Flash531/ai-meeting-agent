import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const profileCookie = cookieStore.get("g_profile")?.value;
  const tokensCookie = cookieStore.get("g_tokens")?.value;

  if (!tokensCookie) {
    return NextResponse.json({ loggedIn: false });
  }

  try {
    const profile = profileCookie ? JSON.parse(profileCookie) : null;
    return NextResponse.json({ loggedIn: true, profile });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}

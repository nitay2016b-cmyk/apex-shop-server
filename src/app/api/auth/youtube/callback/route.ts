import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/youtube";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const settingsUrl = new URL("/settings", url.origin);

  if (error) {
    settingsUrl.searchParams.set("youtube_error", error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set("youtube_error", "missing_code");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeCodeForToken(code);
    settingsUrl.searchParams.set("youtube_connected", "1");
  } catch {
    settingsUrl.searchParams.set("youtube_error", "token_exchange_failed");
  }

  return NextResponse.redirect(settingsUrl);
}

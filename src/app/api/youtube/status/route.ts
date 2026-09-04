import { NextResponse } from "next/server";
import { disconnectYoutube, isYoutubeConfigured, isYoutubeConnected } from "@/lib/youtube";

export async function GET() {
  const configured = isYoutubeConfigured();
  const connected = configured ? await isYoutubeConnected() : false;
  return NextResponse.json({ configured, connected });
}

export async function DELETE() {
  await disconnectYoutube();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getAuthUrl, isYoutubeConfigured } from "@/lib/youtube";

export async function GET() {
  if (!isYoutubeConfigured()) {
    return NextResponse.json(
      {
        error:
          "חיבור YouTube לא הוגדר. יש להוסיף YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET ו-YOUTUBE_REDIRECT_URI לקובץ .env.local",
      },
      { status: 400 },
    );
  }

  return NextResponse.redirect(getAuthUrl());
}

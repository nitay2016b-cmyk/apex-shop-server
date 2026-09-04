import { NextResponse } from "next/server";
import { getDb, mutateDb } from "@/lib/store";
import { newId } from "@/lib/id";
import type { AspectRatio, VideoFormat } from "@/lib/types";

export async function GET() {
  const db = await getDb();
  const formats = [...db.formats].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return NextResponse.json({ formats });
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "יש לתת שם לפורמט" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const format: VideoFormat = {
    id: newId("fmt"),
    name,
    description: typeof body.description === "string" ? body.description : "",
    aspectRatio: (body.aspectRatio as AspectRatio) || "16:9",
    targetDurationSec: Number(body.targetDurationSec) || 60,
    tone: typeof body.tone === "string" ? body.tone : "",
    captions: Boolean(body.captions),
    musicMood: typeof body.musicMood === "string" ? body.musicMood : "",
    instructions: typeof body.instructions === "string" ? body.instructions : "",
    createdAt: now,
    updatedAt: now,
  };

  await mutateDb((db) => {
    db.formats.push(format);
  });

  return NextResponse.json({ format }, { status: 201 });
}

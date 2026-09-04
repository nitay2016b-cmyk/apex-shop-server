import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/store";
import type { AspectRatio } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await mutateDb((db) => {
    const format = db.formats.find((f) => f.id === id);
    if (!format) return null;

    if (typeof body.name === "string" && body.name.trim()) format.name = body.name.trim();
    if (typeof body.description === "string") format.description = body.description;
    if (typeof body.aspectRatio === "string")
      format.aspectRatio = body.aspectRatio as AspectRatio;
    if (typeof body.targetDurationSec === "number")
      format.targetDurationSec = body.targetDurationSec;
    if (typeof body.tone === "string") format.tone = body.tone;
    if (typeof body.captions === "boolean") format.captions = body.captions;
    if (typeof body.musicMood === "string") format.musicMood = body.musicMood;
    if (typeof body.instructions === "string") format.instructions = body.instructions;
    format.updatedAt = new Date().toISOString();

    return format;
  });

  if (!updated) {
    return NextResponse.json({ error: "פורמט לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ format: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existed = await mutateDb((db) => {
    const index = db.formats.findIndex((f) => f.id === id);
    if (index === -1) return false;
    db.formats.splice(index, 1);
    return true;
  });

  if (!existed) {
    return NextResponse.json({ error: "פורמט לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

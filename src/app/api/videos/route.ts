import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { mutateDb, getDb, UPLOADS_DIR } from "@/lib/store";
import { newId } from "@/lib/id";
import type { VideoAsset } from "@/lib/types";

export async function GET() {
  const db = await getDb();
  const videos = [...db.videos].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "לא צורף קובץ וידאו" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "הקובץ שנבחר אינו קובץ וידאו" },
      { status: 400 },
    );
  }

  const id = newId("vid");
  const extension = path.extname(file.name) || ".mp4";
  const storedFileName = `${id}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(/* turbopackIgnore: true */ UPLOADS_DIR, storedFileName), buffer);

  const video: VideoAsset = {
    id,
    originalName: file.name,
    storedFileName,
    mimeType: file.type,
    sizeBytes: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
  };

  await mutateDb((db) => {
    db.videos.push(video);
  });

  return NextResponse.json({ video }, { status: 201 });
}

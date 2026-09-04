import { NextResponse } from "next/server";
import { getDb, mutateDb } from "@/lib/store";
import { newId } from "@/lib/id";
import type { Project } from "@/lib/types";

export async function GET() {
  const db = await getDb();
  const projects = [...db.projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return NextResponse.json({ projects, videos: db.videos, formats: db.formats });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { videoId, formatId } = body as { videoId?: string; formatId?: string };

  if (!videoId || !formatId) {
    return NextResponse.json(
      { error: "נדרשים וידאו ופורמט כדי ליצור פרויקט" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const video = db.videos.find((v) => v.id === videoId);
  const format = db.formats.find((f) => f.id === formatId);

  if (!video || !format) {
    return NextResponse.json({ error: "וידאו או פורמט לא נמצאו" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: newId("proj"),
    title: `${video.originalName.replace(/\.[^/.]+$/, "")} · ${format.name}`,
    videoId,
    formatId,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  await mutateDb((db) => {
    db.projects.push(project);
  });

  return NextResponse.json({ project }, { status: 201 });
}

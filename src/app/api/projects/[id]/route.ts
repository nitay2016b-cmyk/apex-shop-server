import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const project = db.projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: "פרויקט לא נמצא" }, { status: 404 });
  }

  const video = db.videos.find((v) => v.id === project.videoId) ?? null;
  const format = db.formats.find((f) => f.id === project.formatId) ?? null;
  const jobs = db.jobs
    .filter((j) => j.projectId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const publishes = db.publishes
    .filter((p) => p.projectId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ project, video, format, jobs, publishes });
}

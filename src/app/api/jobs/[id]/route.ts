import { NextResponse } from "next/server";
import { getDb } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const job = db.jobs.find((j) => j.id === id);

  if (!job) {
    return NextResponse.json({ error: "משימה לא נמצאה" }, { status: 404 });
  }

  const project = db.projects.find((p) => p.id === job.projectId) ?? null;

  return NextResponse.json({ job, project });
}

import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/store";
import { newId } from "@/lib/id";
import { baseSteps, startPipeline } from "@/lib/pipeline";
import type { EditJob } from "@/lib/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await mutateDb((db) => {
    const project = db.projects.find((p) => p.id === id);
    if (!project) return { error: "פרויקט לא נמצא" as const };

    const format = db.formats.find((f) => f.id === project.formatId);
    if (!format) return { error: "פורמט לא נמצא" as const };

    const job: EditJob = {
      id: newId("job"),
      projectId: id,
      status: "queued",
      progress: 0,
      steps: baseSteps(format),
      createdAt: new Date().toISOString(),
    };

    db.jobs.push(job);
    project.activeJobId = job.id;
    project.status = "editing";
    project.updatedAt = new Date().toISOString();

    return { job };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  startPipeline(result.job.id, id);

  return NextResponse.json({ job: result.job }, { status: 201 });
}

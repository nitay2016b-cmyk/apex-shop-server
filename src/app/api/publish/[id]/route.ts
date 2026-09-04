import { NextResponse } from "next/server";
import path from "path";
import { getDb, mutateDb, UPLOADS_DIR } from "@/lib/store";
import { newId } from "@/lib/id";
import { isYoutubeConfigured, isYoutubeConnected, uploadVideoToYoutube } from "@/lib/youtube";
import type { YoutubePrivacyStatus, YoutubePublish } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const body = await request.json();

  if (!isYoutubeConfigured()) {
    return NextResponse.json(
      {
        error:
          "חיבור YouTube לא הוגדר בפרויקט. הוסף/י YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET ו-YOUTUBE_REDIRECT_URI לקובץ .env.local ואתחל/י את השרת.",
      },
      { status: 400 },
    );
  }

  if (!(await isYoutubeConnected())) {
    return NextResponse.json(
      { error: "לא מחובר לחשבון YouTube. יש להתחבר בעמוד ההגדרות." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    return NextResponse.json({ error: "פרויקט לא נמצא" }, { status: 404 });
  }
  const video = db.videos.find((v) => v.id === project.videoId);
  if (!video) {
    return NextResponse.json({ error: "קובץ הוידאו לא נמצא" }, { status: 404 });
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : project.title;
  const description = typeof body.description === "string" ? body.description : "";
  const tags: string[] = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : [];
  const privacyStatus: YoutubePrivacyStatus = ["public", "unlisted", "private"].includes(
    body.privacyStatus,
  )
    ? body.privacyStatus
    : "private";

  const publishRecord: YoutubePublish = {
    id: newId("pub"),
    projectId,
    status: "uploading",
    createdAt: new Date().toISOString(),
  };

  await mutateDb((db) => {
    db.publishes.push(publishRecord);
  });

  try {
    const filePath = path.join(UPLOADS_DIR, video.storedFileName);
    const result = await uploadVideoToYoutube({
      filePath,
      title,
      description,
      tags,
      privacyStatus,
    });

    const updated = await mutateDb((db) => {
      const record = db.publishes.find((p) => p.id === publishRecord.id);
      if (!record) return null;
      record.status = "done";
      record.youtubeVideoId = result.youtubeVideoId;
      record.youtubeUrl = result.youtubeUrl;
      record.finishedAt = new Date().toISOString();

      const proj = db.projects.find((p) => p.id === projectId);
      if (proj) {
        proj.status = "published";
        proj.updatedAt = new Date().toISOString();
      }
      return record;
    });

    return NextResponse.json({ publish: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ההעלאה ליוטיוב נכשלה";
    const updated = await mutateDb((db) => {
      const record = db.publishes.find((p) => p.id === publishRecord.id);
      if (!record) return null;
      record.status = "error";
      record.errorMessage = message;
      record.finishedAt = new Date().toISOString();
      return record;
    });

    return NextResponse.json({ error: message, publish: updated }, { status: 502 });
  }
}

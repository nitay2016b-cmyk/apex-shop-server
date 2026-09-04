import { getDb, mutateDb } from "./store";
import type { JobStep, SuggestedMetadata, VideoAsset, VideoFormat } from "./types";

function baseSteps(format: VideoFormat): JobStep[] {
  const steps: JobStep[] = [
    { key: "analyze", label: "מנתח את קובץ המקור", status: "pending" },
    {
      key: "moments",
      label: "מזהה רגעים מרכזיים לפי ההנחיות שלך",
      status: "pending",
    },
    {
      key: "aspect",
      label: `מתאים את הפריים ליחס ${format.aspectRatio}`,
      status: "pending",
    },
    {
      key: "trim",
      label: `חותך לאורך יעד של כ-${format.targetDurationSec} שניות`,
      status: "pending",
    },
  ];

  if (format.captions) {
    steps.push({ key: "captions", label: "מוסיף כתוביות אוטומטיות", status: "pending" });
  }

  if (format.musicMood.trim()) {
    steps.push({
      key: "music",
      label: `מוסיף מוזיקת רקע בסגנון "${format.musicMood}"`,
      status: "pending",
    });
  }

  steps.push({ key: "export", label: "ממזג ומייצא את הגרסה הסופית", status: "pending" });
  return steps;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSuggestedMetadata(
  video: VideoAsset,
  format: VideoFormat,
): SuggestedMetadata {
  const baseName = video.originalName.replace(/\.[^/.]+$/, "");
  const title = `${baseName} | ${format.name}`.slice(0, 95);
  const description = [
    `סרטון זה נערך אוטומטית על ידי AI לפי הפורמט "${format.name}".`,
    format.instructions ? `הנחיות עריכה: ${format.instructions}` : null,
    `טון: ${format.tone || "כללי"} | יחס תמונה: ${format.aspectRatio} | אורך יעד: ${format.targetDurationSec} שניות`,
    format.musicMood ? `מוזיקת רקע: ${format.musicMood}` : null,
    "",
    "נוצר עם AI Video Studio.",
  ]
    .filter(Boolean)
    .join("\n");

  const tags = Array.from(
    new Set(
      [
        format.name,
        format.tone,
        format.aspectRatio === "9:16" ? "shorts" : null,
        "ai edited",
        ...format.instructions
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2 && s.length < 25),
      ].filter((v): v is string => Boolean(v && v.length > 0)),
    ),
  ).slice(0, 10);

  return { title, description, tags };
}

export function startPipeline(jobId: string, projectId: string): void {
  void runPipeline(jobId, projectId);
}

async function runPipeline(jobId: string, projectId: string) {
  await mutateDb((db) => {
    const job = db.jobs.find((j) => j.id === jobId);
    if (job) job.status = "running";
    const project = db.projects.find((p) => p.id === projectId);
    if (project) project.status = "editing";
  });

  const snapshot = await getDb();
  const job = snapshot.jobs.find((j) => j.id === jobId);
  if (!job) return;

  const total = job.steps.length;

  for (let i = 0; i < total; i++) {
    const stepKey = job.steps[i].key;

    await mutateDb((db) => {
      const j = db.jobs.find((x) => x.id === jobId);
      if (!j) return;
      const step = j.steps.find((s) => s.key === stepKey);
      if (step) {
        step.status = "running";
        step.startedAt = new Date().toISOString();
      }
    });

    await delay(700 + Math.random() * 900);

    await mutateDb((db) => {
      const j = db.jobs.find((x) => x.id === jobId);
      if (!j) return;
      const step = j.steps.find((s) => s.key === stepKey);
      if (step) {
        step.status = "done";
        step.finishedAt = new Date().toISOString();
      }
      j.progress = Math.round(((i + 1) / total) * 100);
    });
  }

  await mutateDb((db) => {
    const j = db.jobs.find((x) => x.id === jobId);
    const project = db.projects.find((p) => p.id === projectId);
    if (!j || !project) return;

    const video = db.videos.find((v) => v.id === project.videoId);
    const format = db.formats.find((f) => f.id === project.formatId);

    j.status = "done";
    j.finishedAt = new Date().toISOString();
    j.resultSummary = "העריכה הושלמה. תצוגה מקדימה מוכנה מתחת.";

    project.status = "ready";
    project.updatedAt = new Date().toISOString();
    if (video && format) {
      project.suggestedMetadata = buildSuggestedMetadata(video, format);
    }
  });
}

export { baseSteps };

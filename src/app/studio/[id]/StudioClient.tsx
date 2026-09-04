"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { EditJob, JobStep, Project, VideoAsset, VideoFormat, YoutubePublish } from "@/lib/types";
import { formatBytes, formatRelativeTime, statusLabels, statusStyles } from "@/lib/format";

export default function StudioClient({
  project: initialProject,
  video,
  format,
  initialJobs,
  publishes,
}: {
  project: Project;
  video: VideoAsset | null;
  format: VideoFormat | null;
  initialJobs: EditJob[];
  publishes: YoutubePublish[];
}) {
  const [project, setProject] = useState(initialProject);
  const [jobs, setJobs] = useState(initialJobs);
  const [activeJob, setActiveJob] = useState<EditJob | null>(initialJobs[0] ?? null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const donePublish = publishes.find((p) => p.status === "done");

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollJob(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveJob(data.job);
      setJobs((prev) => {
        const others = prev.filter((j) => j.id !== data.job.id);
        return [data.job, ...others];
      });
      if (data.project) setProject(data.project);
      if (data.job.status === "done" || data.job.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 900);
  }

  async function runEdit() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "הרצת העריכה נכשלה");
      setActiveJob(data.job);
      setJobs((prev) => [data.job, ...prev]);
      setProject((prev) => ({ ...prev, status: "editing", activeJobId: data.job.id }));
      pollJob(data.job.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש");
    } finally {
      setStarting(false);
    }
  }

  if (!video || !format) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-400">
        לא נמצאו נתונים מלאים לפרויקט הזה.
      </div>
    );
  }

  const isRunning = activeJob?.status === "running" || activeJob?.status === "queued";
  const isReadyForPublish = project.status === "ready" || project.status === "published";

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr]">
      <aside className="order-2 flex flex-col gap-4 lg:order-1">
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">System Instructions</h2>
            <Link href="/formats" className="text-xs text-fuchsia-400 hover:underline">
              ניהול פורמטים
            </Link>
          </div>
          <p className="mb-3 text-base font-semibold">{format.name}</p>
          <dl className="grid grid-cols-2 gap-y-1.5 text-xs text-zinc-400">
            <dt>יחס תמונה</dt>
            <dd className="text-zinc-200">{format.aspectRatio}</dd>
            <dt>אורך יעד</dt>
            <dd className="text-zinc-200">{format.targetDurationSec} שניות</dd>
            <dt>טון</dt>
            <dd className="text-zinc-200">{format.tone || "—"}</dd>
            <dt>כתוביות</dt>
            <dd className="text-zinc-200">{format.captions ? "כן" : "לא"}</dd>
            <dt>מוזיקה</dt>
            <dd className="text-zinc-200">{format.musicMood || "—"}</dd>
          </dl>
          {format.instructions && (
            <div className="mt-3 rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-zinc-300">
              {format.instructions}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-300">קובץ מקור</h2>
          <p className="truncate text-sm">{video.originalName}</p>
          <p className="mt-1 text-xs text-zinc-500">{formatBytes(video.sizeBytes)}</p>
        </div>

        {jobs.length > 0 && (
          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-300">היסטוריית הרצות</h2>
            <ul className="flex flex-col gap-1.5 text-xs">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface"
                >
                  <span className="text-zinc-400">{formatRelativeTime(job.createdAt)}</span>
                  <span
                    className={
                      job.status === "done"
                        ? "text-emerald-400"
                        : job.status === "error"
                          ? "text-red-400"
                          : "text-amber-400"
                    }
                  >
                    {job.status === "done"
                      ? "הושלם"
                      : job.status === "error"
                        ? "שגיאה"
                        : "בתהליך"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <main className="order-1 flex flex-col gap-5 lg:order-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{project.title}</h1>
            <span
              className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[project.status]}`}
            >
              {statusLabels[project.status]}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runEdit}
              disabled={starting || isRunning}
              className="rounded-full ai-gradient-bg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isRunning ? "ה-AI עורך..." : "▶ הרצת עריכת AI"}
            </button>
            {isReadyForPublish && (
              <Link
                href={`/studio/${project.id}/publish`}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-surface"
              >
                {donePublish ? "צפייה ביוטיוב" : "המשך להעלאה ליוטיוב"}
              </Link>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <video
            controls
            preload="metadata"
            className="max-h-[480px] w-full"
            src={`/api/videos/${video.id}/file`}
          />
        </div>

        {activeJob && <PipelinePanel job={activeJob} />}

        {donePublish && (
          <div className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-500/5 p-4 text-sm">
            הסרטון פורסם ביוטיוב —{" "}
            <a
              href={donePublish.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-fuchsia-400 hover:underline"
            >
              צפייה בסרטון
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function PipelinePanel({ job }: { job: EditJob }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">תהליך העריכה של ה-AI</h2>
        <span className="text-xs text-zinc-500">{job.progress}%</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full ai-gradient-bg transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>
      <ul className="flex flex-col gap-2.5">
        {job.steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </ul>
      {job.status === "done" && job.resultSummary && (
        <p className="mt-3 text-sm text-emerald-400">✓ {job.resultSummary}</p>
      )}
    </div>
  );
}

function StepRow({ step }: { step: JobStep }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <StepIcon status={step.status} />
      <span
        className={
          step.status === "done"
            ? "text-zinc-300"
            : step.status === "running"
              ? "text-foreground font-medium"
              : "text-zinc-500"
        }
      >
        {step.label}
      </span>
    </li>
  );
}

function StepIcon({ status }: { status: JobStep["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        ✓
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-fuchsia-500" />
    );
  }
  if (status === "error") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
        !
      </span>
    );
  }
  return <span className="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-700" />;
}

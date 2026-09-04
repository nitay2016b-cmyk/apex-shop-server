"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, VideoAsset, YoutubePrivacyStatus, YoutubePublish } from "@/lib/types";

export default function PublishClient({
  project,
  video,
  initialPublishes,
  youtubeConfigured,
  youtubeConnected,
}: {
  project: Project;
  video: VideoAsset | null;
  initialPublishes: YoutubePublish[];
  youtubeConfigured: boolean;
  youtubeConnected: boolean;
}) {
  const donePublish = initialPublishes.find((p) => p.status === "done");

  const [title, setTitle] = useState(project.suggestedMetadata?.title ?? project.title);
  const [description, setDescription] = useState(project.suggestedMetadata?.description ?? "");
  const [tags, setTags] = useState((project.suggestedMetadata?.tags ?? []).join(", "));
  const [privacyStatus, setPrivacyStatus] = useState<YoutubePrivacyStatus>("private");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YoutubePublish | null>(donePublish ?? null);

  async function handlePublish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/publish/${project.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          privacyStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ההעלאה נכשלה");
      setResult(data.publish);
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש");
    } finally {
      setBusy(false);
    }
  }

  const canPublish = youtubeConfigured && youtubeConnected && !result;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href={`/studio/${project.id}`} className="text-xs text-zinc-400 hover:text-zinc-200">
        ← חזרה לסטודיו
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        להעלות את &ldquo;{project.title}&rdquo; ישירות ליוטיוב?
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        ה-AI הכין עבורך כותרת, תיאור ותגיות מוצעים. אפשר לערוך הכול לפני ההעלאה.
      </p>

      {!youtubeConfigured && (
        <Banner tone="warn">
          חיבור YouTube לא הוגדר עדיין בשרת. יש להוסיף YOUTUBE_CLIENT_ID,
          YOUTUBE_CLIENT_SECRET ו-YOUTUBE_REDIRECT_URI לקובץ .env.local ולהפעיל מחדש
          את השרת. עד אז אפשר להכין את המטא-דאטה ולפרסם מאוחר יותר.
        </Banner>
      )}

      {youtubeConfigured && !youtubeConnected && (
        <Banner tone="warn">
          עדיין לא מחובר חשבון YouTube.{" "}
          <a href="/api/auth/youtube" className="font-semibold underline">
            התחברות עכשיו
          </a>
        </Banner>
      )}

      <div className="mt-5 flex flex-col gap-4">
        <Field label="כותרת">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" maxLength={100} />
        </Field>
        <Field label="תיאור">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="input resize-none"
          />
        </Field>
        <Field label="תגיות (מופרדות בפסיק)">
          <input value={tags} onChange={(e) => setTags(e.target.value)} className="input" />
        </Field>
        <Field label="פרטיות">
          <select
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value as YoutubePrivacyStatus)}
            className="input"
          >
            <option value="private">פרטי</option>
            <option value="unlisted">לא רשום (קישור בלבד)</option>
            <option value="public">ציבורי</option>
          </select>
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {result ? (
        <div className="mt-6 rounded-xl border border-emerald-900/40 bg-emerald-500/5 p-4 text-sm">
          <p className="font-semibold text-emerald-400">הסרטון הועלה בהצלחה ליוטיוב!</p>
          <a
            href={result.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-emerald-300 underline"
          >
            {result.youtubeUrl}
          </a>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handlePublish}
            disabled={!canPublish || busy || !video}
            className="rounded-full ai-gradient-bg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "מעלה ליוטיוב..." : "כן, להעלות ליוטיוב עכשיו"}
          </button>
          <Link
            href={`/studio/${project.id}`}
            className="rounded-full border border-border px-6 py-2.5 text-sm text-zinc-300 hover:bg-surface"
          >
            לא עכשיו
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function Banner({ tone, children }: { tone: "warn" | "info"; children: React.ReactNode }) {
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
        tone === "warn"
          ? "border-amber-900 bg-amber-950/40 text-amber-300"
          : "border-zinc-700 bg-surface text-zinc-300"
      }`}
    >
      {children}
    </div>
  );
}

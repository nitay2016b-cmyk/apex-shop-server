"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoFormat } from "@/lib/types";
import FormatFields, { emptyFormatFields, type FormatFieldsValue } from "@/components/FormatFields";
import { formatBytes } from "@/lib/format";

function uploadFile(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ video: { id: string } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          reject(new Error(JSON.parse(xhr.responseText).error ?? "העלאה נכשלה"));
        } catch {
          reject(new Error("העלאה נכשלה"));
        }
      }
    };
    xhr.onerror = () => reject(new Error("שגיאת רשת בהעלאה"));
    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export default function UploadClient({ initialFormats }: { initialFormats: VideoFormat[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formats] = useState(initialFormats);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [formatMode, setFormatMode] = useState<"existing" | "new">(
    initialFormats.length > 0 ? "existing" : "new",
  );
  const [selectedFormatId, setSelectedFormatId] = useState(initialFormats[0]?.id ?? "");
  const [newFormat, setNewFormat] = useState<FormatFieldsValue>(emptyFormatFields);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"" | "uploading" | "creating">("");
  const [error, setError] = useState<string | null>(null);

  function handlePick(files: FileList | null) {
    const picked = files?.[0];
    if (picked) setFile(picked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("יש לבחור קובץ וידאו");
      return;
    }
    if (formatMode === "existing" && !selectedFormatId) {
      setError("יש לבחור פורמט קיים או ליצור פורמט חדש");
      return;
    }
    if (formatMode === "new" && !newFormat.name.trim()) {
      setError("יש לתת שם לפורמט החדש");
      return;
    }

    setBusy(true);
    try {
      let formatId = selectedFormatId;

      if (formatMode === "new") {
        const res = await fetch("/api/formats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newFormat),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "יצירת הפורמט נכשלה");
        formatId = data.format.id;
      }

      setStage("uploading");
      const { video } = await uploadFile(file, setProgress);

      setStage("creating");
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, formatId }),
      });
      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error ?? "יצירת הפרויקט נכשלה");

      router.push(`/studio/${projectData.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש");
      setBusy(false);
      setStage("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handlePick(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver ? "border-fuchsia-500 bg-fuchsia-500/5" : "border-border bg-surface/40 hover:border-zinc-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handlePick(e.target.files)}
        />
        {file ? (
          <>
            <p className="font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{formatBytes(file.size)}</p>
            <p className="mt-2 text-xs text-fuchsia-400">לחץ כדי לבחור קובץ אחר</p>
          </>
        ) : (
          <>
            <p className="font-medium">גרור לכאן קובץ וידאו או לחץ לבחירה</p>
            <p className="mt-1 text-xs text-zinc-400">MP4, MOV, WEBM ועוד</p>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">פורמט עריכה</h2>

        {formats.length > 0 && (
          <div className="mb-3 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setFormatMode("existing")}
              className={`rounded-full px-3 py-1.5 ${formatMode === "existing" ? "bg-surface text-foreground" : "text-zinc-500"}`}
            >
              בחירת פורמט קיים
            </button>
            <button
              type="button"
              onClick={() => setFormatMode("new")}
              className={`rounded-full px-3 py-1.5 ${formatMode === "new" ? "bg-surface text-foreground" : "text-zinc-500"}`}
            >
              יצירת פורמט חדש
            </button>
          </div>
        )}

        {formatMode === "existing" ? (
          <select
            value={selectedFormatId}
            onChange={(e) => setSelectedFormatId(e.target.value)}
            className="input w-full"
          >
            {formats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} · {f.aspectRatio} · {f.targetDurationSec}s
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <FormatFields value={newFormat} onChange={setNewFormat} />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {busy && stage === "uploading" && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full ai-gradient-bg transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">מעלה את הסרטון... {progress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="self-start rounded-full ai-gradient-bg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy
          ? stage === "creating"
            ? "יוצר פרויקט..."
            : "מעלה..."
          : "המשך לעריכה עם AI"}
      </button>
    </form>
  );
}

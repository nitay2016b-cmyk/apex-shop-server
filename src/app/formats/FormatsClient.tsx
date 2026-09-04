"use client";

import { useState } from "react";
import type { VideoFormat } from "@/lib/types";
import FormatFields, { emptyFormatFields, type FormatFieldsValue } from "@/components/FormatFields";

function toFieldsValue(format: VideoFormat): FormatFieldsValue {
  return {
    name: format.name,
    description: format.description,
    aspectRatio: format.aspectRatio,
    targetDurationSec: format.targetDurationSec,
    tone: format.tone,
    captions: format.captions,
    musicMood: format.musicMood,
    instructions: format.instructions,
  };
}

export default function FormatsClient({ initialFormats }: { initialFormats: VideoFormat[] }) {
  const [formats, setFormats] = useState(initialFormats);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<FormatFieldsValue>(emptyFormatFields);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FormatFieldsValue>(emptyFormatFields);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createFormat() {
    if (!draft.name.trim()) {
      setError("יש לתת שם לפורמט");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormats((prev) => [data.format, ...prev]);
      setDraft(emptyFormatFields);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "יצירת הפורמט נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/formats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormats((prev) => prev.map((f) => (f.id === id ? data.format : f)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "עדכון הפורמט נכשל");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFormat(id: string) {
    if (!confirm("למחוק את הפורמט הזה?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/formats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("מחיקת הפורמט נכשלה");
      setFormats((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "מחיקת הפורמט נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {creating ? (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <FormatFields value={draft} onChange={setDraft} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={createFormat}
              disabled={busy}
              className="rounded-full ai-gradient-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              שמירת פורמט
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setDraft(emptyFormatFields);
              }}
              className="rounded-full border border-border px-4 py-2 text-sm text-zinc-300 hover:bg-surface"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="self-start rounded-full ai-gradient-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + פורמט חדש
        </button>
      )}

      {formats.length === 0 && !creating && (
        <p className="rounded-xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm text-zinc-400">
          עדיין לא יצרת פורמטים. פורמט ראשון יעזור ל-AI לדעת איך לערוך את הסרטונים שלך.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {formats.map((format) =>
          editingId === format.id ? (
            <div key={format.id} className="rounded-xl border border-border bg-surface/40 p-4">
              <FormatFields value={editDraft} onChange={setEditDraft} />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => saveEdit(format.id)}
                  disabled={busy}
                  className="rounded-full ai-gradient-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  שמירה
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-full border border-border px-4 py-2 text-sm text-zinc-300 hover:bg-surface"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div
              key={format.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-semibold">{format.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {format.aspectRatio} · {format.targetDurationSec}s
                  {format.tone ? ` · ${format.tone}` : ""}
                  {format.captions ? " · כתוביות" : ""}
                  {format.musicMood ? ` · ${format.musicMood}` : ""}
                </p>
                {format.instructions && (
                  <p className="mt-1 line-clamp-2 max-w-xl text-xs text-zinc-500">
                    {format.instructions}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => {
                    setEditingId(format.id);
                    setEditDraft(toFieldsValue(format));
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-zinc-300 hover:bg-surface"
                >
                  עריכה
                </button>
                <button
                  onClick={() => deleteFormat(format.id)}
                  className="rounded-full border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

"use client";

import type { AspectRatio } from "@/lib/types";

export interface FormatFieldsValue {
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  targetDurationSec: number;
  tone: string;
  captions: boolean;
  musicMood: string;
  instructions: string;
}

export const emptyFormatFields: FormatFieldsValue = {
  name: "",
  description: "",
  aspectRatio: "16:9",
  targetDurationSec: 60,
  tone: "",
  captions: true,
  musicMood: "",
  instructions: "",
};

const aspectOptions: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 — יוטיוב רגיל" },
  { value: "9:16", label: "9:16 — Shorts / רילס" },
  { value: "1:1", label: "1:1 — פיד ריבועי" },
  { value: "4:5", label: "4:5 — פורטרט" },
];

export default function FormatFields({
  value,
  onChange,
}: {
  value: FormatFieldsValue;
  onChange: (next: FormatFieldsValue) => void;
}) {
  function set<K extends keyof FormatFieldsValue>(key: K, val: FormatFieldsValue[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="שם הפורמט" className="sm:col-span-2">
        <input
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder='לדוגמה: "טיזר קצר לרשתות חברתיות"'
          className="input"
        />
      </Field>

      <Field label="יחס תמונה">
        <select
          value={value.aspectRatio}
          onChange={(e) => set("aspectRatio", e.target.value as AspectRatio)}
          className="input"
        >
          {aspectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="אורך יעד (שניות)">
        <input
          type="number"
          min={5}
          max={3600}
          value={value.targetDurationSec}
          onChange={(e) => set("targetDurationSec", Number(e.target.value) || 0)}
          className="input"
        />
      </Field>

      <Field label="טון / סגנון">
        <input
          value={value.tone}
          onChange={(e) => set("tone", e.target.value)}
          placeholder="אנרגטי, רגוע, מקצועי..."
          className="input"
        />
      </Field>

      <Field label="מוזיקת רקע">
        <input
          value={value.musicMood}
          onChange={(e) => set("musicMood", e.target.value)}
          placeholder="לופ אלקטרוני קליל..."
          className="input"
        />
      </Field>

      <Field label="כתוביות אוטומטיות" className="flex items-center gap-2 sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={value.captions}
            onChange={(e) => set("captions", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-surface-2 accent-fuchsia-500"
          />
          להוסיף כתוביות אוטומטיות לסרטון
        </label>
      </Field>

      <Field label="הנחיות עריכה ל-AI" className="sm:col-span-2">
        <textarea
          value={value.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={4}
          placeholder='לדוגמה: "תשמור רק על הרגעים הכי מרגשים, תוסיף מעברים מהירים, תפתח עם הוק חזק בשניות הראשונות"'
          className="input resize-none"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

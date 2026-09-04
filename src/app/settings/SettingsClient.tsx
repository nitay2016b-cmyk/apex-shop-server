"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const errorMessages: Record<string, string> = {
  access_denied: "החיבור בוטל על ידך בדף ההרשאות של Google.",
  missing_code: "לא התקבל קוד אימות מ-Google.",
  token_exchange_failed: "החלפת הקוד באסימון גישה נכשלה. ודא/י ש-Client ID/Secret נכונים.",
};

export default function SettingsClient({
  configured,
  connected,
  justConnected,
  connectError,
}: {
  configured: boolean;
  connected: boolean;
  justConnected: boolean;
  connectError?: string;
}) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/youtube/status", { method: "DELETE" });
      setIsConnected(false);
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {justConnected && (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          חשבון YouTube חובר בהצלחה!
        </p>
      )}
      {connectError && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {errorMessages[connectError] ?? "החיבור ל-YouTube נכשל."}
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">YouTube</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {!configured
                ? "לא הוגדרו פרטי OAuth בשרת (.env.local)"
                : isConnected
                  ? "מחובר — סרטונים יעלו לחשבון הזה"
                  : "לא מחובר"}
            </p>
          </div>
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              !configured ? "bg-zinc-600" : isConnected ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </div>

        <div className="mt-4">
          {!configured ? (
            <p className="rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-zinc-400">
              יש להגדיר בקובץ <code className="text-zinc-300">.env.local</code> את המשתנים{" "}
              <code className="text-zinc-300">YOUTUBE_CLIENT_ID</code>,{" "}
              <code className="text-zinc-300">YOUTUBE_CLIENT_SECRET</code> ו-
              <code className="text-zinc-300">YOUTUBE_REDIRECT_URI</code> (ראה/י README), ואז
              להפעיל מחדש את השרת.
            </p>
          ) : isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-full border border-border px-4 py-2 text-sm text-zinc-300 hover:bg-surface disabled:opacity-50"
            >
              {disconnecting ? "מנתק..." : "ניתוק חשבון"}
            </button>
          ) : (
            <a
              href="/api/auth/youtube"
              className="inline-block rounded-full ai-gradient-bg px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              התחברות לחשבון YouTube
            </a>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-5 text-sm text-zinc-400">
        <h2 className="mb-2 font-semibold text-zinc-200">על עריכת ה-AI בגרסה זו</h2>
        <p>
          מנוע עריכת הווידאו כרגע הוא <strong className="text-zinc-200">הדגמה (mock)</strong>:
          התהליך מציג את שלבי העריכה (ניתוח, חיתוך, כתוביות, מוזיקה) אך אינו מפעיל מודל
          וידאו-AI אמיתי על הקובץ. כדי לחבר מנוע אמיתי (כמו Google Veo, Runway וכו&apos;)
          יש להחליף את <code className="text-zinc-300">src/lib/pipeline.ts</code> בקריאה
          אמיתית ל-API של הספק שתבחר/י.
        </p>
      </div>
    </div>
  );
}

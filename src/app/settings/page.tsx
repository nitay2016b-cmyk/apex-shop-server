import { isYoutubeConfigured, isYoutubeConnected } from "@/lib/youtube";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ youtube_connected?: string; youtube_error?: string }>;
}) {
  const params = await searchParams;
  const configured = isYoutubeConfigured();
  const connected = configured ? await isYoutubeConnected() : false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">הגדרות</h1>
      <p className="mt-1 text-sm text-zinc-400">חיבור וניהול חשבון YouTube להעלאה ישירה.</p>

      <SettingsClient
        configured={configured}
        connected={connected}
        justConnected={params.youtube_connected === "1"}
        connectError={params.youtube_error}
      />
    </div>
  );
}

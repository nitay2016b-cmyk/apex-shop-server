import Link from "next/link";
import { getDb } from "@/lib/store";
import { formatRelativeTime, statusLabels, statusStyles } from "@/lib/format";

export default async function LibraryPage() {
  const db = await getDb();
  const projects = [...db.projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">הספרייה שלי</h1>
          <p className="mt-1 text-sm text-zinc-400">
            כל הסרטונים שהעלית והפרויקטים שה-AI עורך או ערך עבורך
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-full ai-gradient-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + התחלת פרויקט חדש
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => {
            const format = db.formats.find((f) => f.id === project.formatId);
            return (
              <Link
                key={project.id}
                href={`/studio/${project.id}`}
                className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-zinc-600"
              >
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <PlayIcon />
                  <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-zinc-200">
                    {format?.aspectRatio ?? "16:9"}
                  </span>
                  <span
                    className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[project.status]}`}
                  >
                    {statusLabels[project.status]}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    {format?.name ?? "ללא פורמט"} · {formatRelativeTime(project.updatedAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ai-gradient-bg">
        <PlayIcon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">עוד אין כאן סרטונים</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">
        העלה סרטון, בחר או צור פורמט עריכה, ותן ל-AI לערוך אותו בשבילך — ואז
        להעלות אותו ישירות ליוטיוב.
      </p>
      <Link
        href="/upload"
        className="mt-5 rounded-full ai-gradient-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        העלאת סרטון ראשון
      </Link>
    </div>
  );
}

function PlayIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} text-zinc-500 transition-colors group-hover:text-zinc-300`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
    </svg>
  );
}

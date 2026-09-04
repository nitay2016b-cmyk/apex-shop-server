import type { ProjectStatus } from "./types";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} שע׳`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `לפני ${diffDay} ימים`;
  return date.toLocaleDateString("he-IL");
}

export const statusLabels: Record<ProjectStatus, string> = {
  draft: "טיוטה",
  editing: "בעריכה על ידי AI",
  ready: "מוכן להעלאה",
  published: "פורסם ביוטיוב",
};

export const statusStyles: Record<ProjectStatus, string> = {
  draft: "bg-zinc-800 text-zinc-300",
  editing: "bg-amber-500/15 text-amber-400",
  ready: "bg-emerald-500/15 text-emerald-400",
  published: "bg-fuchsia-500/15 text-fuchsia-400",
};

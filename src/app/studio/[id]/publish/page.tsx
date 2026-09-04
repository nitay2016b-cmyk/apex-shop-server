import { notFound } from "next/navigation";
import { getDb } from "@/lib/store";
import { isYoutubeConfigured, isYoutubeConnected } from "@/lib/youtube";
import PublishClient from "./PublishClient";

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) notFound();

  const video = db.videos.find((v) => v.id === project.videoId) ?? null;
  const publishes = db.publishes
    .filter((p) => p.projectId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const configured = isYoutubeConfigured();
  const connected = configured ? await isYoutubeConnected() : false;

  return (
    <PublishClient
      project={project}
      video={video}
      initialPublishes={publishes}
      youtubeConfigured={configured}
      youtubeConnected={connected}
    />
  );
}

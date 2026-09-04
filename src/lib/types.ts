export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export interface VideoAsset {
  id: string;
  originalName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VideoFormat {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  targetDurationSec: number;
  tone: string;
  captions: boolean;
  musicMood: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export type JobStepStatus = "pending" | "running" | "done" | "error";

export interface JobStep {
  key: string;
  label: string;
  status: JobStepStatus;
  startedAt?: string;
  finishedAt?: string;
}

export type JobStatus = "queued" | "running" | "done" | "error";

export interface EditJob {
  id: string;
  projectId: string;
  status: JobStatus;
  progress: number;
  steps: JobStep[];
  createdAt: string;
  finishedAt?: string;
  resultSummary?: string;
}

export type ProjectStatus = "draft" | "editing" | "ready" | "published";

export interface SuggestedMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  videoId: string;
  formatId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  activeJobId?: string;
  suggestedMetadata?: SuggestedMetadata;
}

export type YoutubePrivacyStatus = "public" | "unlisted" | "private";

export interface YoutubePublish {
  id: string;
  projectId: string;
  status: "pending" | "uploading" | "done" | "error";
  youtubeVideoId?: string;
  youtubeUrl?: string;
  errorMessage?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface Database {
  videos: VideoAsset[];
  formats: VideoFormat[];
  projects: Project[];
  jobs: EditJob[];
  publishes: YoutubePublish[];
}

import { google } from "googleapis";
import type { Credentials } from "google-auth-library";
import { createReadStream } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DATA_DIR } from "./store";
import type { YoutubePrivacyStatus } from "./types";

const TOKEN_FILE = path.join(DATA_DIR, "youtube-token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export type StoredToken = Credentials;

export function isYoutubeConfigured(): boolean {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID &&
      process.env.YOUTUBE_CLIENT_SECRET &&
      process.env.YOUTUBE_REDIRECT_URI,
  );
}

function getOAuthClient() {
  if (!isYoutubeConfigured()) {
    throw new Error("YouTube OAuth is not configured");
  }
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI,
  );
}

export function getAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForToken(code: string): Promise<void> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

async function loadToken(): Promise<StoredToken | null> {
  try {
    const raw = await readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

export async function isYoutubeConnected(): Promise<boolean> {
  if (!isYoutubeConfigured()) return false;
  const token = await loadToken();
  return Boolean(token?.refresh_token || token?.access_token);
}

export async function disconnectYoutube(): Promise<void> {
  await writeFile(TOKEN_FILE, JSON.stringify({}, null, 2), "utf-8").catch(() => undefined);
}

async function getAuthorizedClient() {
  const client = getOAuthClient();
  const token = await loadToken();
  if (!token) {
    throw new Error("לא מחובר לחשבון YouTube");
  }
  client.setCredentials(token);
  return client;
}

export interface UploadVideoInput {
  filePath: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: YoutubePrivacyStatus;
}

export interface UploadVideoResult {
  youtubeVideoId: string;
  youtubeUrl: string;
}

export async function uploadVideoToYoutube(
  input: UploadVideoInput,
): Promise<UploadVideoResult> {
  const auth = await getAuthorizedClient();
  const youtube = google.youtube({ version: "v3", auth });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: input.title,
        description: input.description,
        tags: input.tags,
      },
      status: {
        privacyStatus: input.privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(input.filePath),
    },
  });

  const youtubeVideoId = res.data.id;
  if (!youtubeVideoId) {
    throw new Error("ההעלאה נכשלה: לא התקבל מזהה סרטון מיוטיוב");
  }

  return {
    youtubeVideoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
  };
}

import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getDb, UPLOADS_DIR } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const video = db.videos.find((v) => v.id === id);

  if (!video) {
    return new Response("Video not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, video.storedFileName);
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) {
    return new Response("File missing on disk", { status: 404 });
  }

  const range = request.headers.get("range");

  if (!range) {
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": video.mimeType,
        "Content-Length": String(fileStat.size),
        "Accept-Ranges": "bytes",
      },
    });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match?.[1] ? parseInt(match[1], 10) : 0;
  const end = match?.[2] ? parseInt(match[2], 10) : fileStat.size - 1;
  const chunkSize = end - start + 1;

  const stream = Readable.toWeb(
    createReadStream(filePath, { start, end }),
  ) as ReadableStream;

  return new Response(stream, {
    status: 206,
    headers: {
      "Content-Type": video.mimeType,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

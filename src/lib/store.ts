import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { Database } from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

const emptyDb: Database = {
  videos: [],
  formats: [],
  projects: [],
  jobs: [],
  publishes: [],
};

async function ensureDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

async function readDb(): Promise<Database> {
  await ensureDirs();
  try {
    const raw = await readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return { ...emptyDb, ...parsed };
  } catch {
    await writeFile(DB_FILE, JSON.stringify(emptyDb, null, 2), "utf-8");
    return { ...emptyDb };
  }
}

async function writeDb(db: Database): Promise<void> {
  const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpFile, JSON.stringify(db, null, 2), "utf-8");
  await rename(tmpFile, DB_FILE);
}

// Serializes reads-then-writes so concurrent requests don't clobber each other.
let writeLock: Promise<unknown> = Promise.resolve();

export function mutateDb<T>(fn: (db: Database) => T): Promise<T> {
  const task = writeLock.then(async () => {
    const db = await readDb();
    const result = fn(db);
    await writeDb(db);
    return result;
  });
  // Swallow errors for the chain itself so one failed mutation doesn't
  // permanently break the queue for subsequent callers.
  writeLock = task.catch(() => undefined);
  return task;
}

export async function getDb(): Promise<Database> {
  return readDb();
}

import { promises as fs } from "fs";
import path from "path";
import type { Session } from "@/store/session-store";

const DATA_DIR = path.join(process.cwd(), "data", "sessions");

function userFile(userId: string) {
  return path.join(DATA_DIR, `${userId}.json`);
}

export async function readUserSessions(userId: string): Promise<Session[] | null> {
  try {
    const raw = await fs.readFile(userFile(userId), "utf-8");
    const data = JSON.parse(raw) as { sessions: Session[] };
    return data.sessions ?? null;
  } catch {
    return null;
  }
}

export async function writeUserSessions(
  userId: string,
  sessions: Session[],
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    userFile(userId),
    JSON.stringify({ userId, updatedAt: Date.now(), sessions }, null, 2),
    "utf-8",
  );
}

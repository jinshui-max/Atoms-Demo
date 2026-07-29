import type { Session } from "@/store/session-store";
import { readUserSessions, writeUserSessions } from "@/lib/session-server";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }
  const sessions = await readUserSessions(userId);
  return Response.json({ sessions: sessions ?? [] });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userId?: string;
    sessions?: Session[];
  };
  if (!body.userId || !Array.isArray(body.sessions)) {
    return Response.json({ error: "userId and sessions required" }, { status: 400 });
  }
  try {
    await writeUserSessions(body.userId, body.sessions);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

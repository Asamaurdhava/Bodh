import { getSavedSessions } from "@/lib/db";

export async function GET() {
  try {
    const sessions = getSavedSessions("default");
    return Response.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load history";
    return Response.json({ error: message }, { status: 500 });
  }
}

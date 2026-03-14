import { NextRequest } from "next/server";
import { getGrowthData } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId =
    request.nextUrl.searchParams.get("user_id") || "default";

  try {
    const growth = getGrowthData(userId);
    return Response.json(growth);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load growth data";
    return Response.json({ error: message }, { status: 500 });
  }
}

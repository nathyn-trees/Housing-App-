import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatchesForUser } from "@/lib/matches";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const result = await getMatchesForUser(user.id);
  return NextResponse.json(result);
}

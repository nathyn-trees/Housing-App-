import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

const VALID_STATUSES = ["ACTIVE", "PAUSED", "FOUND"];

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { status } = (await request.json()) as { status?: string };
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "status must be one of ACTIVE, PAUSED, FOUND." }, { status: 400 });
  }

  const need = await prisma.housingNeed.update({ where: { userId: user.id }, data: { status } }).catch(() => null);
  if (!need) return NextResponse.json({ error: "No housing need to update." }, { status: 404 });

  return NextResponse.json(need);
}

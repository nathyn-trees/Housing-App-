import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import { checkRateLimit } from "@/lib/rateLimit";

const VALID_REASONS = ["harassment", "scam", "no_show", "fake_profile", "other"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const limited = checkRateLimit(request, "reports", 10, 60 * 60 * 1000);
  if (limited) return limited;

  const { targetUserId, reason, details } = (await request.json()) as {
    targetUserId?: string;
    reason?: string;
    details?: string;
  };

  if (!targetUserId || !reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "targetUserId and a valid reason are required." }, { status: 400 });
  }
  if (targetUserId === user.id) return NextResponse.json({ error: "You can't report yourself." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const report = await prisma.report.create({
    data: { reporterId: user.id, targetId: targetUserId, reason, details: details?.slice(0, 2000) },
  });

  return NextResponse.json(report);
}

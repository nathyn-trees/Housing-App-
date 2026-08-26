import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@housing-app/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const report = await prisma.report.update({ where: { id: params.id }, data: { status: "REVIEWED" } }).catch(() => null);
  if (!report) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(report);
}

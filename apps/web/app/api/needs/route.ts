import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const need = await prisma.housingNeed.findUnique({ where: { userId: user.id } });
  return NextResponse.json(need);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const {
    city,
    neighborhoods,
    budgetMin,
    budgetMax,
    moveInDate,
    urgency,
    roomType,
    amenities,
    notes,
    visibility,
  } = body;

  if (!city || budgetMin == null || budgetMax == null || !moveInDate) {
    return NextResponse.json({ error: "City, budget range, and move-in date are required." }, { status: 400 });
  }
  if (Number(budgetMin) > Number(budgetMax)) {
    return NextResponse.json({ error: "Minimum budget can't exceed maximum budget." }, { status: 400 });
  }

  const data = {
    city,
    neighborhoods: neighborhoods || null,
    budgetMin: Number(budgetMin),
    budgetMax: Number(budgetMax),
    moveInDate: new Date(moveInDate),
    urgency: urgency ?? "FLEXIBLE",
    roomType: roomType ?? "ANY",
    amenities: amenities || null,
    notes: notes || null,
    visibility: visibility ? Number(visibility) : 2,
    status: "ACTIVE" as const,
  };

  const need = await prisma.housingNeed.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(need);
}

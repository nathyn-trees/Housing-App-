import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const offer = await prisma.housingOffer.findUnique({ where: { userId: user.id } });
  return NextResponse.json(offer);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const { city, neighborhood, rentAmount, availableDate, roomType, amenities, description, visibility } = body;

  if (!city || rentAmount == null || !availableDate) {
    return NextResponse.json({ error: "City, rent amount, and available date are required." }, { status: 400 });
  }

  const data = {
    city,
    neighborhood: neighborhood || null,
    rentAmount: Number(rentAmount),
    availableDate: new Date(availableDate),
    roomType: roomType ?? "PRIVATE_ROOM",
    amenities: amenities || null,
    description: description || null,
    visibility: visibility ? Number(visibility) : 2,
    status: "ACTIVE" as const,
  };

  const offer = await prisma.housingOffer.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(offer);
}

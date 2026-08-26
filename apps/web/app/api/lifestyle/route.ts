import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const lifestyle = await prisma.lifestyleProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json(lifestyle);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const { cleanliness, timeAtHome, hostingGuests, socialStyle } = body as {
    cleanliness?: number;
    timeAtHome?: string;
    hostingGuests?: string;
    socialStyle?: string;
  };

  if (!cleanliness || !timeAtHome || !hostingGuests || !socialStyle) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const cleanlinessNum = Number(cleanliness);
  if (!Number.isInteger(cleanlinessNum) || cleanlinessNum < 1 || cleanlinessNum > 5) {
    return NextResponse.json({ error: "Cleanliness must be a whole number from 1 to 5." }, { status: 400 });
  }

  const data = { cleanliness: cleanlinessNum, timeAtHome, hostingGuests, socialStyle };
  const lifestyle = await prisma.lifestyleProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(lifestyle);
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const need = await prisma.housingNeed.findUnique({ where: { userId: user.id } });
  const offer = await prisma.housingOffer.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    city: user.city,
    hasNeed: !!need,
    hasOffer: !!offer,
  });
}

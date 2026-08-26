import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const requests = await prisma.connectionRequest.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { userA: true, userB: true },
    orderBy: { createdAt: "desc" },
  });

  const shaped = requests.map((r) => {
    const other = r.userAId === user.id ? r.userB : r.userA;
    const direction = r.userAId === user.id ? "outgoing" : "incoming";
    return {
      id: r.id,
      status: r.status,
      direction,
      other: { id: other.id, name: other.name, email: other.email },
      createdAt: r.createdAt,
    };
  });

  return NextResponse.json(shaped);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { email } = (await request.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "No account with that email." }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "You can't connect with yourself." }, { status: 400 });

  const existing = await prisma.connectionRequest.findFirst({
    where: {
      OR: [
        { userAId: user.id, userBId: target.id },
        { userAId: target.id, userBId: user.id },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "A connection with this person already exists." }, { status: 409 });

  const connection = await prisma.connectionRequest.create({
    data: { userAId: user.id, userBId: target.id, status: "PENDING" },
  });

  return NextResponse.json(connection);
}

import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import { computeDegrees, type Edge } from "@housing-app/shared";
import VouchForm from "@/components/VouchForm";

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");

  if (params.userId === viewer.id) redirect("/matches");

  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target) notFound();

  const connections = await prisma.connectionRequest.findMany({ where: { status: "ACCEPTED" } });
  const edges: Edge[] = connections.map((c) => [c.userAId, c.userBId]);
  const degrees = computeDegrees(edges, viewer.id, 3);
  const degreeInfo = degrees.get(target.id);

  if (!degreeInfo) {
    return (
      <div className="mx-auto max-w-md text-center text-neutral-600">
        <p>This person isn&apos;t in your network yet, so their profile is private.</p>
      </div>
    );
  }

  const via = degreeInfo.via ? await prisma.user.findUnique({ where: { id: degreeInfo.via } }) : null;
  const vouches = await prisma.vouch.findMany({ where: { targetId: target.id }, include: { voucher: true } });
  const alreadyVouched = vouches.some((v) => v.voucherId === viewer.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">{target.name}</h1>
        <p className="text-sm text-neutral-500">
          {degreeInfo.degree === 1 ? "Direct connection" : `${degreeInfo.degree} degrees away${via ? ` · connected via ${via.name}` : ""}`}
        </p>
      </div>

      {target.bio && <p className="text-neutral-700">{target.bio}</p>}

      <section>
        <h2 className="mb-2 font-semibold text-neutral-800">Vouches ({vouches.length})</h2>
        {vouches.length === 0 ? (
          <p className="text-sm text-neutral-500">No one has vouched for {target.name} yet.</p>
        ) : (
          <ul className="space-y-2">
            {vouches.map((v) => (
              <li key={v.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <span className="font-medium">{v.voucher.name}</span>: {v.note}
              </li>
            ))}
          </ul>
        )}
      </section>

      {degreeInfo.degree === 1 && !alreadyVouched && <VouchForm targetUserId={target.id} targetName={target.name} />}
    </div>
  );
}

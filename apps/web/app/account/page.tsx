import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import BlockedUsersList from "@/components/BlockedUsersList";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const blocks = await prisma.block.findMany({ where: { blockerId: user.id }, include: { blocked: true } });

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Account</h1>
        <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
      </div>

      <section>
        <h2 className="mb-2 font-semibold text-neutral-800">Blocked users</h2>
        <BlockedUsersList initialBlocked={blocks.map((b) => ({ id: b.blocked.id, name: b.blocked.name }))} />
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="mb-2 font-semibold text-red-800">Delete account</h2>
        <p className="mb-3 text-sm text-red-700">
          This permanently deletes your profile, housing need/offer, connections, messages, and vouches. This can&apos;t
          be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@housing-app/db";
import SignupForm from "@/components/SignupForm";

export default async function InvitePage({ params }: { params: { code: string } }) {
  const inviter = await prisma.user.findUnique({ where: { inviteCode: params.code } });

  if (!inviter) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-bold text-brand-700">That invite link isn&apos;t valid</h1>
        <p className="text-neutral-600">It may have been mistyped. You can still sign up on your own.</p>
        <Link href="/signup" className="inline-block rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          Sign up
        </Link>
      </div>
    );
  }

  return <SignupForm inviteCode={params.code} inviterName={inviter.name} />;
}

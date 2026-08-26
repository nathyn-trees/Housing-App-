import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import LifestyleForm from "@/components/LifestyleForm";

export default async function LifestylePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existingLifestyle = await prisma.lifestyleProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">What are you like to live with?</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Optional, but it&apos;s what actually makes or breaks a roommate — shown as compatibility, not scored
          publicly.
        </p>
      </div>
      <LifestyleForm existingLifestyle={existingLifestyle} />
    </div>
  );
}

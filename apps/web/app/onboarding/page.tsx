import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import NeedForm from "@/components/NeedForm";
import StatusControl from "@/components/StatusControl";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existingNeed = await prisma.housingNeed.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">What are you looking for?</h1>
        <p className="mt-1 text-sm text-neutral-600">
          This stays private — only people within your network (a friend, or a friend of a friend) will ever see it.
        </p>
      </div>
      {existingNeed && <StatusControl endpoint="/api/needs/status" status={existingNeed.status} />}
      <NeedForm
        defaultCity={existingNeed?.city ?? user.city ?? ""}
        existingNeed={
          existingNeed
            ? {
                ...existingNeed,
                moveInDate: existingNeed.moveInDate.toISOString().slice(0, 10),
              }
            : null
        }
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@housing-app/db";
import OfferForm from "@/components/OfferForm";

export default async function ListRoomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existingOffer = await prisma.housingOffer.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-700">Have a room to fill?</h1>
        <p className="mt-1 text-sm text-neutral-600">
          This is shown the same way as a housing need — private, and only surfaced to people in your network.
        </p>
      </div>
      <OfferForm
        defaultCity={existingOffer?.city ?? user.city ?? ""}
        existingOffer={
          existingOffer
            ? { ...existingOffer, availableDate: existingOffer.availableDate.toISOString().slice(0, 10) }
            : null
        }
      />
    </div>
  );
}

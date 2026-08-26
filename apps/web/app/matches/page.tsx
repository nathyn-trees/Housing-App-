import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatchesForUser } from "@/lib/matches";
import MatchCard from "@/components/MatchCard";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { viewerNeed, matches } = await getMatchesForUser(user.id);

  if (!viewerNeed) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h1 className="text-2xl font-bold text-brand-700">Tell us what you&apos;re looking for</h1>
        <p className="text-neutral-600">Add your housing needs to start seeing private matches from your network.</p>
        <Link href="/onboarding" className="inline-block rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700">Your matches</h1>
        <Link href="/onboarding" className="text-sm text-brand-700 underline">
          Edit what you&apos;re looking for
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-600">
          <p>No matches yet within your network. As your connections and their connections join, you&apos;ll see them here.</p>
          <Link href="/connections" className="mt-3 inline-block text-brand-700 underline">
            Grow your network
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.userId} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

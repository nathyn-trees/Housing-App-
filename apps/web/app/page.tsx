import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/matches");

  return (
    <div className="space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-brand-700">Housing, through people you actually trust.</h1>
        <p className="mx-auto max-w-xl text-neutral-600">
          Nobody wants to broadcast their rent or how desperate they are to move. But the people in your circle
          already know who&apos;s looking, who has a room, and who&apos;d actually get along. Nearby turns that
          word-of-mouth into a private, ranked feed — visible only to people within a few degrees of your network.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/signup" className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
            Get started
          </Link>
          <Link href="/login" className="rounded border border-brand-600 px-4 py-2 text-brand-700 hover:bg-brand-50">
            Log in
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="font-semibold text-brand-700">1. Say what you need</h2>
          <p className="mt-1 text-sm text-neutral-600">Budget, timeline, and how urgent it is — private by default.</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="font-semibold text-brand-700">2. We check your network</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Matches only surface if there&apos;s a path to them — a direct friend, or a friend of a friend.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="font-semibold text-brand-700">3. Get vouched, get connected</h2>
          <p className="mt-1 text-sm text-neutral-600">
            See who connects you, and who&apos;s already vouched for someone before you reach out.
          </p>
        </div>
      </section>
    </div>
  );
}

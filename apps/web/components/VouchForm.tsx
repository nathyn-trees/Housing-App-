"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VouchForm({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/vouches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, note }),
    });
    setLoading(false);
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="text-sm text-brand-700">Thanks for vouching for {targetName}!</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
      <label className="block text-sm font-medium">Vouch for {targetName}</label>
      <textarea
        required
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="e.g. Known them for years, clean and reliable roommate."
        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
      <button disabled={loading} className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Saving..." : "Submit vouch"}
      </button>
    </form>
  );
}

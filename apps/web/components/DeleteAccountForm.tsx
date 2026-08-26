"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleDelete} className="space-y-2">
      <input
        type="password"
        required
        placeholder="Confirm your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border border-red-300 px-3 py-2"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Deleting..." : confirming ? "Click again to permanently delete" : "Delete my account"}
      </button>
    </form>
  );
}

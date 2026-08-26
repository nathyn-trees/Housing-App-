"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Connection {
  id: string;
  status: "PENDING" | "ACCEPTED";
  direction: "incoming" | "outgoing";
  other: { id: string; name: string; email: string };
}

export default function ConnectionsClient({ initialConnections }: { initialConnections: Connection[] }) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function respond(id: string, action: "accept" | "decline") {
    await fetch(`/api/connections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setConnections((prev) =>
      action === "decline" ? prev.filter((c) => c.id !== id) : prev.map((c) => (c.id === id ? { ...c, status: "ACCEPTED" } : c)),
    );
    router.refresh();
  }

  const accepted = connections.filter((c) => c.status === "ACCEPTED");
  const incomingPending = connections.filter((c) => c.status === "PENDING" && c.direction === "incoming");
  const outgoingPending = connections.filter((c) => c.status === "PENDING" && c.direction === "outgoing");

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2 rounded-lg border border-neutral-200 bg-white p-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="flex-1 rounded border border-neutral-300 px-3 py-2"
        />
        <button disabled={loading} className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Adding..." : "Add connection"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {incomingPending.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Requests waiting on you</h2>
          <ul className="space-y-2">
            {incomingPending.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
                <span>{c.other.name} ({c.other.email})</span>
                <div className="flex gap-2">
                  <button onClick={() => respond(c.id, "accept")} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
                    Accept
                  </button>
                  <button onClick={() => respond(c.id, "decline")} className="rounded px-3 py-1 text-sm text-neutral-500 hover:text-red-600">
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold text-neutral-800">Connections ({accepted.length})</h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-neutral-500">No connections yet — add someone by email above.</p>
        ) : (
          <ul className="space-y-2">
            {accepted.map((c) => (
              <li key={c.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                {c.other.name} ({c.other.email})
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoingPending.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Waiting on them</h2>
          <ul className="space-y-2">
            {outgoingPending.map((c) => (
              <li key={c.id} className="rounded-lg border border-dashed border-neutral-300 bg-white p-3 text-neutral-500">
                {c.other.name} ({c.other.email}) — pending
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

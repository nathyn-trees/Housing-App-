"use client";

import { useState } from "react";

interface Blocked {
  id: string;
  name: string;
}

export default function BlockedUsersList({ initialBlocked }: { initialBlocked: Blocked[] }) {
  const [blocked, setBlocked] = useState(initialBlocked);

  async function unblock(id: string) {
    await fetch(`/api/blocks/${id}`, { method: "DELETE" });
    setBlocked((prev) => prev.filter((b) => b.id !== id));
  }

  if (blocked.length === 0) {
    return <p className="text-sm text-neutral-500">You haven&apos;t blocked anyone.</p>;
  }

  return (
    <ul className="space-y-2">
      {blocked.map((b) => (
        <li key={b.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm">
          {b.name}
          <button onClick={() => unblock(b.id)} className="text-brand-700 underline">
            Unblock
          </button>
        </li>
      ))}
    </ul>
  );
}

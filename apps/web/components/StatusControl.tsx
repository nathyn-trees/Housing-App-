"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "ACTIVE", label: "Active", hint: "Visible in matches" },
  { value: "PAUSED", label: "Paused", hint: "Hidden until you reactivate" },
  { value: "FOUND", label: "Found a place", hint: "Hidden, marks your search done" },
] as const;

export default function StatusControl({ endpoint, status }: { endpoint: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    if (next === current) return;
    setLoading(true);
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    setCurrent(next);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium">Status</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={loading}
            onClick={() => setStatus(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-sm disabled:opacity-50 ${
              current === opt.value ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700 hover:border-brand-400"
            }`}
            title={opt.hint}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {current !== "ACTIVE" && (
        <p className="mt-2 text-xs text-neutral-500">
          {current === "FOUND" ? "Nice — you're hidden from matches now that you're set." : "You're paused and hidden from matches."}
        </p>
      )}
    </div>
  );
}

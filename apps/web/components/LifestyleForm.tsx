"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FREQUENCIES = ["NEVER", "RARELY", "SOMETIMES", "OFTEN", "ALWAYS"] as const;
const SOCIAL_STYLES = ["INTROVERT", "AMBIVERT", "EXTROVERT"] as const;

interface ExistingLifestyle {
  cleanliness: number;
  timeAtHome: string;
  hostingGuests: string;
  socialStyle: string;
}

function ChoiceRow({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full border px-3 py-1.5 text-sm ${
            value === opt ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-300 text-neutral-700 hover:border-brand-400"
          }`}
        >
          {opt.charAt(0) + opt.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}

export default function LifestyleForm({ existingLifestyle }: { existingLifestyle: ExistingLifestyle | null }) {
  const router = useRouter();
  const [cleanliness, setCleanliness] = useState(existingLifestyle?.cleanliness ?? 3);
  const [timeAtHome, setTimeAtHome] = useState(existingLifestyle?.timeAtHome ?? "SOMETIMES");
  const [hostingGuests, setHostingGuests] = useState(existingLifestyle?.hostingGuests ?? "SOMETIMES");
  const [socialStyle, setSocialStyle] = useState(existingLifestyle?.socialStyle ?? "AMBIVERT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/lifestyle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleanliness, timeAtHome, hostingGuests, socialStyle }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/matches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-5">
      <div>
        <label className="block text-sm font-medium">
          Cleanliness: <span className="text-neutral-500">{cleanliness === 1 ? "very relaxed" : cleanliness === 5 ? "very tidy" : ""}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={cleanliness}
          onChange={(e) => setCleanliness(Number(e.target.value))}
          className="mt-2 w-full accent-brand-600"
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Relaxed</span>
          <span>Very tidy</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">How often are you home?</label>
        <ChoiceRow options={FREQUENCIES} value={timeAtHome} onChange={setTimeAtHome} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">How often do you have people over?</label>
        <ChoiceRow options={FREQUENCIES} value={hostingGuests} onChange={setHostingGuests} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Social style</label>
        <ChoiceRow options={SOCIAL_STYLES} value={socialStyle} onChange={setSocialStyle} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/matches")}
          className="text-sm text-neutral-500 underline hover:text-neutral-700"
        >
          Skip for now
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save and see matches"}
        </button>
      </div>
    </form>
  );
}

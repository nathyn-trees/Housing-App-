"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExistingNeed {
  city: string;
  neighborhoods: string | null;
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  urgency: string;
  roomType: string;
  amenities: string | null;
  notes: string | null;
  visibility: number;
}

export default function NeedForm({ defaultCity, existingNeed }: { defaultCity: string; existingNeed: ExistingNeed | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: form.get("city"),
        neighborhoods: form.get("neighborhoods"),
        budgetMin: form.get("budgetMin"),
        budgetMax: form.get("budgetMax"),
        moveInDate: form.get("moveInDate"),
        urgency: form.get("urgency"),
        roomType: form.get("roomType"),
        amenities: form.get("amenities"),
        notes: form.get("notes"),
        visibility: form.get("visibility"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/lifestyle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium">City</label>
          <input
            name="city"
            required
            defaultValue={existingNeed?.city ?? defaultCity}
            placeholder="New York, NY"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Neighborhoods (optional)</label>
          <input
            name="neighborhoods"
            defaultValue={existingNeed?.neighborhoods ?? ""}
            placeholder="Bushwick, Williamsburg"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Min budget ($/mo)</label>
          <input
            name="budgetMin"
            type="number"
            required
            defaultValue={existingNeed?.budgetMin}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Max budget ($/mo)</label>
          <input
            name="budgetMax"
            type="number"
            required
            defaultValue={existingNeed?.budgetMax}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Move-in date</label>
          <input
            name="moveInDate"
            type="date"
            required
            defaultValue={existingNeed?.moveInDate}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Urgency</label>
          <select
            name="urgency"
            defaultValue={existingNeed?.urgency ?? "FLEXIBLE"}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="FLEXIBLE">Flexible</option>
            <option value="SOON">Soon</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Room type</label>
          <select
            name="roomType"
            defaultValue={existingNeed?.roomType ?? "ANY"}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="ANY">Open to anything</option>
            <option value="PRIVATE_ROOM">Private room</option>
            <option value="SHARED_ROOM">Shared room</option>
            <option value="ENTIRE_PLACE">Entire place</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Must-have amenities (optional)</label>
          <input
            name="amenities"
            defaultValue={existingNeed?.amenities ?? ""}
            placeholder="in-unit laundry, pet friendly"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea
            name="notes"
            defaultValue={existingNeed?.notes ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Who can see this?</label>
          <select
            name="visibility"
            defaultValue={existingNeed?.visibility ?? 2}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value={1}>Direct connections only</option>
            <option value={2}>Friends of friends (recommended)</option>
            <option value={3}>Up to 3 degrees out</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : existingNeed ? "Update" : "Save and see matches"}
      </button>
    </form>
  );
}

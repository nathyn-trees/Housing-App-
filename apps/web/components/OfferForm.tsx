"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExistingOffer {
  city: string;
  neighborhood: string | null;
  rentAmount: number;
  availableDate: string;
  roomType: string;
  amenities: string | null;
  description: string | null;
  visibility: number;
}

export default function OfferForm({ defaultCity, existingOffer }: { defaultCity: string; existingOffer: ExistingOffer | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: form.get("city"),
        neighborhood: form.get("neighborhood"),
        rentAmount: form.get("rentAmount"),
        availableDate: form.get("availableDate"),
        roomType: form.get("roomType"),
        amenities: form.get("amenities"),
        description: form.get("description"),
        visibility: form.get("visibility"),
      }),
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium">City</label>
          <input
            name="city"
            required
            defaultValue={existingOffer?.city ?? defaultCity}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Neighborhood</label>
          <input
            name="neighborhood"
            defaultValue={existingOffer?.neighborhood ?? ""}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Rent ($/mo)</label>
          <input
            name="rentAmount"
            type="number"
            required
            defaultValue={existingOffer?.rentAmount}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Available from</label>
          <input
            name="availableDate"
            type="date"
            required
            defaultValue={existingOffer?.availableDate}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Room type</label>
          <select
            name="roomType"
            defaultValue={existingOffer?.roomType ?? "PRIVATE_ROOM"}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          >
            <option value="PRIVATE_ROOM">Private room</option>
            <option value="SHARED_ROOM">Shared room</option>
            <option value="ENTIRE_PLACE">Entire place</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Amenities</label>
          <input
            name="amenities"
            defaultValue={existingOffer?.amenities ?? ""}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            defaultValue={existingOffer?.description ?? ""}
            rows={3}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium">Who can see this?</label>
          <select
            name="visibility"
            defaultValue={existingOffer?.visibility ?? 2}
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
        {loading ? "Saving..." : existingOffer ? "Update" : "Save"}
      </button>
    </form>
  );
}

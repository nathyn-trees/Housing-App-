"use client";

import { useState } from "react";
import Link from "next/link";
import type { EnrichedMatch } from "@/lib/matches";

const URGENCY_LABEL: Record<string, string> = { FLEXIBLE: "Flexible", SOON: "Soon", URGENT: "Urgent" };

function formatBudget(min: number, max: number) {
  return min === max ? `$${min}/mo` : `$${min}–$${max}/mo`;
}

export default function MatchCard({ match }: { match: EnrichedMatch }) {
  const [action, setAction] = useState(match.action);
  const [busy, setBusy] = useState(false);

  async function sendAction(next: "INTERESTED" | "PASSED") {
    setBusy(true);
    await fetch("/api/matches/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: match.userId, action: next }),
    });
    setBusy(false);
    setAction(next);
  }

  if (action === "PASSED") return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/profile/${match.userId}`} className="font-semibold text-brand-700 hover:underline">
            {match.name}
          </Link>
          <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            {match.kind === "offer" ? "Has a room" : "Looking for a place"}
          </span>
        </div>
        <span className="text-xs font-medium text-brand-600">{match.score}% match</span>
      </div>

      <p className="mt-1 text-xs text-neutral-500">
        {match.degree === 1
          ? "Direct connection"
          : match.via
            ? `Connected via ${match.via.name} (${match.degree} degrees away)`
            : `${match.degree} degrees away`}
        {match.vouchCount > 0 && ` · ${match.vouchCount} vouch${match.vouchCount === 1 ? "" : "es"}`}
      </p>

      {match.bio && <p className="mt-2 text-sm text-neutral-700">{match.bio}</p>}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-600">
        <div>
          <dt className="inline font-medium">Budget: </dt>
          <dd className="inline">{formatBudget(match.need.budgetMin, match.need.budgetMax)}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Move-in: </dt>
          <dd className="inline">{new Date(match.need.moveInDate).toLocaleDateString()}</dd>
        </div>
        {match.kind === "need" && (
          <div>
            <dt className="inline font-medium">Urgency: </dt>
            <dd className="inline">{URGENCY_LABEL[match.need.urgency]}</dd>
          </div>
        )}
        {match.need.neighborhoods && (
          <div className="col-span-2">
            <dt className="inline font-medium">Area: </dt>
            <dd className="inline">{match.need.neighborhoods}</dd>
          </div>
        )}
      </dl>

      {(match.need.notes || match.need.description) && (
        <p className="mt-2 rounded bg-neutral-50 p-2 text-sm text-neutral-600">{match.need.notes || match.need.description}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          onClick={() => sendAction("INTERESTED")}
          className={`rounded px-3 py-1.5 text-sm ${
            action === "INTERESTED" ? "bg-brand-600 text-white" : "border border-brand-600 text-brand-700 hover:bg-brand-50"
          }`}
        >
          {action === "INTERESTED" ? "Interested ✓" : "I'm interested"}
        </button>
        <button disabled={busy} onClick={() => sendAction("PASSED")} className="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-red-600">
          Pass
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { EnrichedMatch } from "@/lib/matches";

const URGENCY_LABEL: Record<string, string> = { FLEXIBLE: "Flexible", SOON: "Soon", URGENT: "Urgent" };

const BREAKDOWN_BARS: { key: keyof EnrichedMatch["breakdown"]; label: string }[] = [
  { key: "budget", label: "Budget" },
  { key: "location", label: "Area" },
  { key: "timeline", label: "Timing" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "trust", label: "Trust" },
];

function formatBudget(min: number, max: number) {
  return min === max ? `$${min}/mo` : `$${min}–$${max}/mo`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
          {initials(match.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/profile/${match.userId}`} className="truncate font-semibold text-brand-700 hover:underline">
              {match.name}
            </Link>
            <span className="shrink-0 text-xs font-medium text-brand-600">{match.score}%</span>
          </div>
          <p className="truncate text-xs text-neutral-500">
            {match.degree === 1 ? "Direct connection" : match.via ? `Via ${match.via.name}` : `${match.degree} degrees away`}
            {match.vouchCount > 0 && ` · ${match.vouchCount} vouch${match.vouchCount === 1 ? "" : "es"}`}
          </p>
        </div>
      </div>

      <span className="mt-3 w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
        {match.kind === "offer" ? "Has a room" : "Looking for a place"}
      </span>

      <dl className="mt-2 space-y-0.5 text-sm text-neutral-600">
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
          <div className="truncate">
            <dt className="inline font-medium">Area: </dt>
            <dd className="inline">{match.need.neighborhoods}</dd>
          </div>
        )}
      </dl>

      <div className="mt-3 space-y-1">
        {BREAKDOWN_BARS.map(({ key, label }) => {
          const isLifestyle = key === "lifestyle";
          const noProfile = isLifestyle && !match.lifestyle;
          const value = match.breakdown[key];
          return (
            <div key={key} className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="w-14 shrink-0">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${noProfile ? "bg-neutral-200" : "bg-brand-500"}`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </div>
              {noProfile && <span className="shrink-0 text-neutral-400">n/a</span>}
            </div>
          );
        })}
      </div>

      {(match.need.notes || match.need.description) && (
        <p className="mt-3 line-clamp-2 rounded bg-neutral-50 p-2 text-sm text-neutral-600">
          {match.need.notes || match.need.description}
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-3">
        <button
          disabled={busy}
          onClick={() => sendAction("INTERESTED")}
          className={`flex-1 rounded px-3 py-1.5 text-sm ${
            action === "INTERESTED" ? "bg-brand-600 text-white" : "border border-brand-600 text-brand-700 hover:bg-brand-50"
          }`}
        >
          {action === "INTERESTED" ? "Interested ✓" : "I'm interested"}
        </button>
        <button disabled={busy} onClick={() => sendAction("PASSED")} className="rounded px-3 py-1.5 text-sm text-neutral-500 hover:text-red-600">
          Pass
        </button>
        {match.canMessage && (
          <Link href={`/messages/${match.userId}`} className="rounded px-3 py-1.5 text-sm text-brand-700 underline">
            Message
          </Link>
        )}
      </div>
    </div>
  );
}

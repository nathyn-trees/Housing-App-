"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "scam", label: "Scam" },
  { value: "no_show", label: "No-show" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "other", label: "Other" },
];

export default function ReportBlockControls({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const router = useRouter();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, reason, details }),
    });
    setBusy(false);
    setReportSent(true);
    setShowReportForm(false);
  }

  async function handleBlock() {
    if (!confirm(`Block ${targetName}? You won't see each other anywhere in the app, and this removes your connection.`)) return;
    setBusy(true);
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    setBusy(false);
    setBlocked(true);
    router.push("/matches");
    router.refresh();
  }

  if (blocked) return null;

  return (
    <div className="border-t border-neutral-200 pt-4 text-sm">
      {reportSent ? (
        <p className="text-neutral-500">Thanks — we&apos;ve received your report.</p>
      ) : showReportForm ? (
        <form onSubmit={submitReport} className="space-y-2">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="rounded border border-neutral-300 px-2 py-1">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            rows={2}
            className="w-full rounded border border-neutral-300 px-2 py-1"
          />
          <div className="flex gap-2">
            <button disabled={busy} className="rounded bg-neutral-800 px-3 py-1.5 text-white">
              Submit report
            </button>
            <button type="button" onClick={() => setShowReportForm(false)} className="text-neutral-500">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-4 text-neutral-500">
          <button onClick={() => setShowReportForm(true)} className="underline hover:text-neutral-700">
            Report
          </button>
          <button onClick={handleBlock} disabled={busy} className="underline hover:text-red-600">
            Block
          </button>
        </div>
      )}
    </div>
  );
}

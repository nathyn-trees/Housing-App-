"use client";

import { useState } from "react";

export default function InviteLinkCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/invite/${inviteCode}` : `/invite/${inviteCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
      <h2 className="font-semibold text-brand-700">Invite someone directly</h2>
      <p className="mt-1 text-sm text-brand-700">
        Skip the group chat — send this link to a friend who&apos;s looking for a place. They&apos;ll be connected to
        you the moment they sign up.
      </p>
      <div className="mt-3 flex gap-2">
        <input readOnly value={link} className="flex-1 rounded border border-brand-200 bg-white px-3 py-2 text-sm text-neutral-700" />
        <button onClick={handleCopy} className="rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

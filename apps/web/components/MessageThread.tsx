"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 4000;

export default function MessageThread({ otherId, otherName, viewerId }: { otherId: string; otherName: string; viewerId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/messages/${otherId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/${otherId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setSending(false);
    if (res.ok) {
      setDraft("");
      await load();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-xl flex-col">
      <div className="mb-3 flex items-center justify-between">
        <Link href={`/profile/${otherId}`} className="text-lg font-semibold text-brand-700 hover:underline">
          {otherName}
        </Link>
        <Link href="/messages" className="text-sm text-neutral-500 underline">
          All messages
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
        {messages.length === 0 && <p className="text-center text-sm text-neutral-500">Say hello.</p>}
        {messages.map((m) => {
          const mine = m.senderId === viewerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-800"}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 rounded border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

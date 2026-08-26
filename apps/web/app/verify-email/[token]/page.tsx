"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    })
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [params.token]);

  return (
    <div className="mx-auto max-w-sm space-y-4 text-center">
      {status === "loading" && <p className="text-neutral-600">Verifying...</p>}
      {status === "ok" && (
        <>
          <h1 className="text-xl font-bold text-brand-700">Email verified</h1>
          <Link href="/matches" className="inline-block rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
            Go to matches
          </Link>
        </>
      )}
      {status === "error" && <p className="text-red-600">This verification link is invalid or has expired.</p>}
    </div>
  );
}

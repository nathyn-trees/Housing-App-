"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailBanner() {
  const [needsVerification, setNeedsVerification] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => setNeedsVerification(!!me && !me.emailVerified))
      .catch(() => {});
  }, []);

  async function handleResend() {
    await fetch("/api/auth/request-verification", { method: "POST" });
    setSent(true);
  }

  if (!needsVerification) return null;

  return (
    <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
      {sent ? (
        "Verification email sent — check your inbox."
      ) : (
        <>
          Please verify your email.{" "}
          <button onClick={handleResend} className="underline">
            Resend verification link
          </button>
        </>
      )}
    </div>
  );
}

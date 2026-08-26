"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupForm({ inviteCode, inviterName }: { inviteCode?: string; inviterName?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        city: form.get("city"),
        inviteCode,
        agreedToTerms: agreed,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">{inviterName ? `Join ${inviterName} on Nearby` : "Create your account"}</h1>
      {inviterName && (
        <p className="rounded bg-brand-50 p-3 text-sm text-brand-700">
          You&apos;ll be connected with {inviterName} right away, and see everyone reachable through them.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input name="city" placeholder="New York, NY" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-brand-700 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="text-brand-700 underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-700 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

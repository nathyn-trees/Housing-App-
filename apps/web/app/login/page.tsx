"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
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
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Log in</h1>
      <p className="rounded bg-brand-50 p-3 text-sm text-brand-700">
        Demo accounts: alice@example.com / bob@example.com / cara@example.com / nathyn@example.com — password{" "}
        <code>password123</code>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-700 underline">
              Forgot password?
            </Link>
          </div>
          <input name="password" type="password" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-sm text-neutral-600">
        Need an account?{" "}
        <Link href="/signup" className="text-brand-700 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

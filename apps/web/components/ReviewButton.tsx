"use client";

import { useRouter } from "next/navigation";

export default function ReviewButton({ reportId }: { reportId: string }) {
  const router = useRouter();

  async function handleClick() {
    await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="mt-2 text-sm text-brand-700 underline">
      Mark reviewed
    </button>
  );
}

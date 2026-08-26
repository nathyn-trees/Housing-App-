import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@housing-app/db";
import ReviewButton from "@/components/ReviewButton";

export default async function AdminReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/matches");

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { reporter: true, target: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-700">Reports</h1>
      {reports.length === 0 ? (
        <p className="text-neutral-600">No reports filed.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {r.reporter.name} reported {r.target.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {r.reason} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  {r.details && <p className="mt-1 text-sm text-neutral-700">{r.details}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${r.status === "OPEN" ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"}`}>
                  {r.status}
                </span>
              </div>
              {r.status === "OPEN" && <ReviewButton reportId={r.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

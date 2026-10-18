"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusTransitions: Record<string, string[]> = {
  REPORTED: ["ANALYZING", "VERIFIED", "CANCELLED"],
  ANALYZING: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED"],
};

export default function IncidentStatusActions({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextOptions = statusTransitions[currentStatus] || [];

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/operator/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (nextOptions.length === 0) {
    return <p className="mt-4 text-xs text-zinc-500">No further transitions available.</p>;
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Update Incident Status
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {nextOptions.map((status) => (
          <button
            key={status}
            disabled={loading}
            onClick={() => handleStatusChange(status)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
          >
            {loading ? "Updating..." : `Move to ${status.replaceAll("_", " ")}`}
          </button>
        ))}
      </div>
    </div>
  );
}
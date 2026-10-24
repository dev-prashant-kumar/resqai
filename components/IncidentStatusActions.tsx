"use client";

import { useState } from "react";
import { CheckCircle2, PlayCircle, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateIncidentStatus } from "@/app/actions/incidentsActions";

export default function IncidentStatusActions({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (targetStatus: string) => {
    setLoading(true);
    setErrorMsg(null);

    const res = await updateIncidentStatus(incidentId, targetStatus);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to update status");
      setLoading(false);
    } else {
      router.refresh();
      setLoading(false);
    }
  };

  const normalizedStatus = currentStatus.toUpperCase();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101115] p-5">
      <h3 className="text-sm font-bold text-white">Responder State Machine</h3>
      <p className="text-xs text-zinc-400">
        Transition active telemetry state for this emergency dispatch.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Set to In Progress / Assigned */}
        {normalizedStatus !== "IN_PROGRESS" && normalizedStatus !== "RESOLVED" && (
          <button
            disabled={loading}
            onClick={() => handleStatusChange("IN_PROGRESS")}
            className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            <span>Mark In Progress</span>
          </button>
        )}

        {/* Set to Resolved */}
        {normalizedStatus !== "RESOLVED" && (
          <button
            disabled={loading}
            onClick={() => handleStatusChange("RESOLVED")}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>Mark Resolved</span>
          </button>
        )}

        {normalizedStatus === "RESOLVED" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Incident Operation Completed</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
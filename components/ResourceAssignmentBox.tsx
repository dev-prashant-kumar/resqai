"use client";

import { useState } from "react";
import { Truck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { assignResourceToIncident } from "@/app/actions/resourceActions";

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  status: string;
}

export default function ResourceAssignmentBox({
  incidentId,
  availableResources,
}: {
  incidentId: string;
  availableResources: Resource[];
}) {
  const [selectedResource, setSelectedResource] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const router = useRouter();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await assignResourceToIncident(incidentId, selectedResource);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to assign unit");
      setLoading(false);
    } else {
      setSuccessMsg(true);
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101115] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="h-4 w-4 text-red-400" />
        <h3 className="text-sm font-bold text-white">Field Unit Dispatch Matrix</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        Assign available regional response units to handle this incident.
      </p>

      {successMsg ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Unit successfully dispatched to sector!</span>
        </div>
      ) : (
        <form onSubmit={handleAssign} className="space-y-3">
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
          >
            <option value="">Select available unit...</option>
            {availableResources.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.resource_type}) — {unit.status}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !selectedResource}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Dispatch Unit</span>
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 mt-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
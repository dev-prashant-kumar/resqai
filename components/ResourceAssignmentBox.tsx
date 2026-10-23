"use client";

import { useState } from "react";
import {
  Truck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  XCircle,
  ShieldAlert,
  Flame,
  Activity,
  Radio,
  Home,
  Wrench,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { assignResourceToIncident, releaseResource } from "@/app/actions/resourceActions";

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  status: string;
  capacity?: number | null;
  contact_phone?: string | null;
}

interface ComponentProps {
  incidentId: string;
  incidentType?: string;
  medicalRequired?: boolean;
  evacuationRequired?: boolean;
  availableResources?: Resource[];
  assignedResources?: Resource[];
}

export default function ResourceAssignmentBox({
  incidentId,
  incidentType = "",
  medicalRequired = false,
  evacuationRequired = false,
  availableResources = [],
  assignedResources = [],
}: ComponentProps) {
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Smart AI Recommendation Logic based on enum types
  const getRecommendedTypes = () => {
    const recs: string[] = [];
    const type = incidentType.toUpperCase();

    if (medicalRequired || type.includes("MEDICAL") || type.includes("ACCIDENT")) {
      recs.push("AMBULANCE", "MEDICAL_TEAM");
    }
    if (type.includes("FIRE") || type.includes("EXPLOSION")) {
      recs.push("EMERGENCY_VEHICLE");
    }
    if (evacuationRequired || type.includes("FLOOD") || type.includes("DISASTER")) {
      recs.push("RESCUE_TEAM", "SHELTER", "VOLUNTEER");
    }
    if (type.includes("CRIME") || type.includes("SECURITY")) {
      recs.push("EMERGENCY_VEHICLE", "VOLUNTEER");
    }

    return recs.length > 0 ? recs : ["AMBULANCE", "RESCUE_TEAM"];
  };

  const recommendedTypes = getRecommendedTypes();

  const getResourceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "AMBULANCE":
        return <Activity className="h-4 w-4 text-emerald-400" />;
      case "RESCUE_TEAM":
        return <ShieldAlert className="h-4 w-4 text-amber-400" />;
      case "MEDICAL_TEAM":
        return <Activity className="h-4 w-4 text-rose-400" />;
      case "EMERGENCY_VEHICLE":
        return <Truck className="h-4 w-4 text-blue-400" />;
      case "VOLUNTEER":
        return <Radio className="h-4 w-4 text-purple-400" />;
      case "SHELTER":
        return <Home className="h-4 w-4 text-teal-400" />;
      default:
        return <Wrench className="h-4 w-4 text-zinc-400" />;
    }
  };

  const filteredResources = availableResources.filter((res) =>
    res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.resource_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await assignResourceToIncident(incidentId, selectedResource);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to dispatch unit");
    } else {
      setSelectedResource("");
      router.refresh();
    }
    setLoading(false);
  };

  const handleRelease = async (resourceId: string) => {
    setReleasingId(resourceId);
    const res = await releaseResource(resourceId, incidentId);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to release unit");
    } else {
      router.refresh();
    }
    setReleasingId(null);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Tactical Resource Allocation</h3>
            <p className="text-xs text-zinc-400">Select and dispatch field units to this incident</p>
          </div>
        </div>
        <span className="w-fit flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" /> AI Dispatch Assistant Active
        </span>
      </div>

      {/* AI Suggested Badges */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
        <p className="text-xs font-semibold text-cyan-200 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Priority Recommended Unit Types for {incidentType || "Emergency"}:
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {recommendedTypes.map((type) => (
            <span
              key={type}
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300 tracking-wider uppercase"
            >
              ⚡ {type.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Currently Dispatched Units */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
          <span>Active Dispatched Units</span>
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300">
            {assignedResources.length} Deployed
          </span>
        </h4>

        {assignedResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-zinc-500">
            No active units assigned yet. Select an available unit below to dispatch.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {assignedResources.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                    {getResourceTypeIcon(unit.resource_type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{unit.name}</p>
                    <p className="text-[10px] text-emerald-300 font-mono mt-0.5">
                      {unit.resource_type.replaceAll("_", " ")} • DISPATCHED
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRelease(unit.id)}
                  disabled={releasingId === unit.id}
                  className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50 shrink-0"
                >
                  {releasingId === unit.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  <span>Release</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Units Selection Cards */}
      <form onSubmit={handleAssign} className="space-y-4 border-t border-white/10 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-zinc-200">
            Select Unit to Dispatch ({availableResources.length} Available)
          </label>

          {/* Quick Search Filter */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Card Grid Selector */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-xs text-zinc-500">
              No matching available resources found in database.
            </div>
          ) : (
            filteredResources.map((unit) => {
              const isRecommended = recommendedTypes.some((rec) =>
                unit.resource_type.toUpperCase().includes(rec)
              );
              const isSelected = selectedResource === unit.id;

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedResource(unit.id)}
                  className={`group relative flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-red-500 bg-red-950/20 shadow-lg ring-1 ring-red-500"
                      : isRecommended
                      ? "border-cyan-500/40 bg-cyan-950/10 hover:border-cyan-400"
                      : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shrink-0">
                      {getResourceTypeIcon(unit.resource_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white group-hover:text-red-300 transition">
                          {unit.name}
                        </p>
                        {isRecommended && (
                          <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 uppercase">
                            ⭐ AI Choice
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {unit.resource_type.replaceAll("_", " ")} • Capacity: {unit.capacity || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase">
                      AVAILABLE
                    </span>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                        isSelected
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submit Dispatch Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedResource}
            className="flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 px-6 py-3 text-xs font-bold text-white transition disabled:opacity-40 shadow-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>Confirm & Dispatch Selected Unit</span>
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-rose-400 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
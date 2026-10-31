
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
  Activity,
  Radio,
  Home,
  Wrench,
  Search,
  RefreshCw,
  MapPin,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  assignResourceToIncident,
  releaseResource,
} from "@/app/actions/resourceActions";

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  status: string;
  capacity?: number | null;
  contact_phone?: string | null;
}

interface RankedResource extends Resource {
  score: number;
  reasons: string[];
  distance_km: number | null;
}

interface ComponentProps {
  incidentId: string;
  incidentType?: string;
  medicalRequired?: boolean;
  evacuationRequired?: boolean;
  availableResources?: Resource[];
  assignedResources?: Resource[];
}

interface MatchResponse {
  success: boolean;
  message: string;
  incident?: {
    id: string;
    title: string;
    severity: string;
    risk_score: number;
  };
  analysis_method?: string;
  requires_human_review?: boolean;
  recommendations?: RankedResource[];
  total_recommendations?: number;
}

export default function ResourceAssignmentBox({
  incidentId,
  incidentType = "",
  medicalRequired = false,
  evacuationRequired = false,
  availableResources = [],
  assignedResources = [],
}: ComponentProps) {
  const [selectedResource, setSelectedResource] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<
    RankedResource[]
  >([]);

  const [hasGenerated, setHasGenerated] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] =
    useState(false);

  const router = useRouter();

  // Resource icons
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

  // Distance labels
  const getDistanceLabel = (distance: number | null) => {
    if (distance === null || !Number.isFinite(distance)) {
      return {
        label: "Distance unavailable",
        className: "text-zinc-400",
      };
    }

    if (distance <= 5) {
      return {
        label: "Very nearby",
        className: "text-emerald-400",
      };
    }

    if (distance <= 15) {
      return {
        label: "Nearby",
        className: "text-emerald-400",
      };
    }

    if (distance <= 30) {
      return {
        label: "Regional",
        className: "text-amber-400",
      };
    }

    return {
      label: "Distant",
      className: "text-rose-400",
    };
  };

  // Generate recommendations using the actual API
  const handleGenerateRecommendations = async () => {
    setMatching(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedResource("");

    try {
      const response = await fetch("/api/ai/match-resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          incidentId,
        }),
      });

      const data: MatchResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to generate resource recommendations"
        );
      }

      setRecommendations(data.recommendations ?? []);
      setHasGenerated(true);

      if (!data.recommendations?.length) {
        setSuccessMsg(
          "No matching available resources were found. You can still use manual selection."
        );
      } else {
        setSuccessMsg(
          `${data.total_recommendations ?? data.recommendations.length} resource recommendations generated.`
        );
      }
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Something went wrong while matching resources."
      );
    } finally {
      setMatching(false);
    }
  };

  // Manual and recommended resource assignment
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResource) {
      setErrorMsg("Please select a resource first.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await assignResourceToIncident(
        incidentId,
        selectedResource
      );

      if (!result.success) {
        setErrorMsg(result.error || "Failed to dispatch resource.");
        return;
      }

      setSelectedResource("");

      setSuccessMsg("Resource successfully assigned.");

      // Refresh server-rendered resource data
      router.refresh();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to assign resource."
      );
    } finally {
      setLoading(false);
    }
  };

  // Release assigned resource
  const handleRelease = async (resourceId: string) => {
    setReleasingId(resourceId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await releaseResource(resourceId, incidentId);

      if (!result.success) {
        setErrorMsg(result.error || "Failed to release resource.");
        return;
      }

      setSuccessMsg("Resource successfully released.");
      router.refresh();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Failed to release resource."
      );
    } finally {
      setReleasingId(null);
    }
  };

  // Search available resources
  const filteredResources = availableResources.filter((resource) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.resource_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Display recommendations
  const displayedRecommendations = showAllRecommendations
    ? recommendations
    : recommendations.slice(0, 5);

  // Check whether a recommended resource is already assigned
  const isAlreadyAssigned = (resourceId: string) =>
    assignedResources.some((resource) => resource.id === resourceId);

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-[#101115] p-5 shadow-2xl sm:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
            <Truck className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Tactical Resource Allocation
            </h3>

            <p className="text-xs text-zinc-400">
              Resource matching and operator-controlled dispatch
            </p>
          </div>
        </div>

        <span className="flex w-fit items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300">
          <BrainCircuit className="h-3.5 w-3.5" />
          Rule-Based Matching
        </span>
      </div>

      {/* AI Resource Recommendations */}
      <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Resource Recommendations
            </h4>

            <p className="mt-1 text-[11px] text-zinc-400">
              Generated using incident analysis and available resource data.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateRecommendations}
            disabled={matching}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {matching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            {matching
              ? "Matching Resources..."
              : hasGenerated
                ? "Refresh Recommendations"
                : "Generate Recommendations"}
          </button>
        </div>

        {hasGenerated && (
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-semibold text-cyan-300">
              RULE-BASED
            </span>

            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-semibold text-amber-300">
              HUMAN REVIEW REQUIRED
            </span>

            <span className="text-zinc-400">
              {recommendations.length} recommendations
            </span>
          </div>
        )}

        {/* Empty state */}
        {!hasGenerated && (
          <div className="rounded-xl border border-dashed border-cyan-500/20 bg-black/20 p-5 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-cyan-400" />

            <p className="text-xs font-semibold text-zinc-200">
              No recommendations generated yet
            </p>

            <p className="mt-1 text-[11px] text-zinc-500">
              Generate recommendations to find suitable available resources.
            </p>
          </div>
        )}

        {/* Recommendation cards */}
        {hasGenerated && recommendations.length > 0 && (
          <div className="space-y-3">

            {displayedRecommendations.map((resource) => {
              const selected = selectedResource === resource.id;
              const assigned = isAlreadyAssigned(resource.id);
              const distance = getDistanceLabel(resource.distance_km);

              return (
                <div
                  key={resource.id}
                  className={`rounded-xl border p-3.5 transition ${
                    selected
                      ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400/40"
                      : "border-white/10 bg-black/30 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        {getResourceTypeIcon(resource.resource_type)}
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-xs font-bold text-white">
                          {resource.name}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-400">
                          {resource.resource_type.replaceAll("_", " ")}
                          {" • "}
                          Capacity: {resource.capacity ?? "N/A"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <MapPin className="h-3 w-3" />

                            {resource.distance_km !== null
                              ? `${resource.distance_km.toFixed(2)} km`
                              : "Unknown distance"}
                          </span>

                          <span className={`text-[10px] font-bold ${distance.className}`}>
                            {distance.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                      <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-black text-cyan-300">
                        {resource.score}/100
                      </span>

                      <span className="text-[9px] uppercase text-zinc-500">
                        Match score
                      </span>
                    </div>
                  </div>

                  {/* Reasons */}
                  {resource.reasons?.length > 0 && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Matching explanation
                      </p>

                      <ul className="space-y-1">
                        {resource.reasons.map((reason, index) => (
                          <li
                            key={`${resource.id}-${index}`}
                            className="flex items-start gap-2 text-[10px] text-zinc-400"
                          >
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Distance warning */}
                  {resource.distance_km !== null &&
                    resource.distance_km > 30 && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />

                        <p className="text-[10px] text-rose-300">
                          This resource is more than 30 km away. Verify travel
                          time, operational availability and deployment
                          suitability before assignment.
                        </p>
                      </div>
                    )}

                  {/* Selection */}
                  <div className="mt-3 flex justify-end">
                    {assigned ? (
                      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
                        Already assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResource(
                            selected ? "" : resource.id
                          )
                        }
                        className={`rounded-xl px-3 py-2 text-[10px] font-bold transition ${
                          selected
                            ? "border border-cyan-400 bg-cyan-500/20 text-cyan-200"
                            : "border border-white/10 bg-white/5 text-zinc-300 hover:border-cyan-400/50"
                        }`}
                      >
                        {selected ? "Selected" : "Select Resource"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {recommendations.length > 5 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllRecommendations(!showAllRecommendations)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10"
              >
                {showAllRecommendations ? (
                  <>
                    Show Less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show All {recommendations.length} Resources
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {hasGenerated && recommendations.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-amber-400" />

            <p className="text-xs text-zinc-400">
              No matching available resources found.
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Try manual resource selection below.
            </p>
          </div>
        )}

        {/* Human review notice */}
        {hasGenerated && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

            <p className="text-[10px] leading-relaxed text-amber-200/80">
              These are rule-based recommendations, not validated emergency
              suitability assessments. Verify resource capabilities,
              location and availability. An operator must approve every
              assignment.
            </p>
          </div>
        )}
      </section>

      {/* Currently assigned resources */}
      <section>
        <h4 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
          <span>Active Dispatched Units</span>

          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
            {assignedResources.length} Deployed
          </span>
        </h4>

        {assignedResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-zinc-500">
            No active units assigned yet.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {assignedResources.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 shadow-lg"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    {getResourceTypeIcon(unit.resource_type)}
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-xs font-bold text-white">
                      {unit.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-emerald-300">
                      {unit.resource_type.replaceAll("_", " ")}
                      {" • DISPATCHED"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRelease(unit.id)}
                  disabled={releasingId === unit.id}
                  className="flex shrink-0 items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-50"
                >
                  {releasingId === unit.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}

                  Release
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual resource selection */}
      <form
        onSubmit={handleAssign}
        className="space-y-4 border-t border-white/10 pt-5"
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-bold text-zinc-200">
            Manual Resource Selection ({availableResources.length} Available)
          </label>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />

            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {filteredResources.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-xs text-zinc-500">
              No matching available resources found.
            </div>
          ) : (
            filteredResources.map((unit) => {
              const selected = selectedResource === unit.id;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedResource(selected ? "" : unit.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                    selected
                      ? "border-red-500 bg-red-950/20 ring-1 ring-red-500"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      {getResourceTypeIcon(unit.resource_type)}
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-xs font-bold text-white">
                        {unit.name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-zinc-400">
                        {unit.resource_type.replaceAll("_", " ")}
                        {" • Capacity: "}
                        {unit.capacity ?? "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                      AVAILABLE
                    </span>

                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        selected
                          ? "border-red-500 bg-red-500"
                          : "border-white/20"
                      }`}
                    >
                      {selected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Assignment confirmation */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-3 sm:flex-row sm:items-center">
          <p className="text-[10px] text-zinc-500">
            {selectedResource
              ? "Selected resource requires operator confirmation."
              : "Select a recommended or manually listed resource."}
          </p>

          <button
            type="submit"
            disabled={loading || !selectedResource}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            Confirm & Dispatch Selected Unit
          </button>
        </div>
      </form>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}

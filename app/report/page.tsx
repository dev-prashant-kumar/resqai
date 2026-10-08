"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  MapPin,
  Flame,
  Waves,
  HeartPulse,
  Car,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function ReportEmergencyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("MEDICAL");
  const [affectedCount, setAffectedCount] = useState(1);
  const [medicalRequired, setMedicalRequired] = useState(true);
  const [evacuationRequired, setEvacuationRequired] = useState(false);

  // GPS state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  // --------------------------------------------------
  // GET CURRENT GPS LOCATION
  // --------------------------------------------------

  const handleGetLocation = () => {
    setFetchingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setAddress(
          `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
        );

        setFetchingLocation(false);
      },
      (err) => {
        console.error("Location error:", err);

        setError(
          "Unable to retrieve your location. Please allow location access and try again."
        );

        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------------------------
  // SUBMIT EMERGENCY
  // --------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // ----------------------------------------------
      // Validate form
      // ----------------------------------------------

      if (!title.trim()) {
        setError("Please enter an incident title.");
        setLoading(false);
        return;
      }

      if (!description.trim()) {
        setError("Please provide a description of the emergency.");
        setLoading(false);
        return;
      }

      if (!incidentType) {
        setError("Please select an emergency category.");
        setLoading(false);
        return;
      }

      if (affectedCount < 1) {
        setError("Number of affected people must be at least 1.");
        setLoading(false);
        return;
      }

      // ----------------------------------------------
      // GPS is required
      // ----------------------------------------------

      if (latitude === null || longitude === null) {
        setError(
          "Please capture your current GPS location before submitting the emergency."
        );
        setLoading(false);
        return;
      }

      // ----------------------------------------------
      // Get authenticated user
      // ----------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // ----------------------------------------------
      // Insert incident into Supabase
      // ----------------------------------------------

      const { error: insertError } = await supabase
        .from("incidents")
        .insert({
          reported_by: user.id,

          title: title.trim(),

          description: description.trim(),

          incident_type: incidentType,

          // Initial severity.
          // AI will update this later.
          severity: "HIGH",

          // Correct initial status from our schema.
          status: "REPORTED",

          affected_people: Number(affectedCount),

          medical_required: medicalRequired,

          evacuation_required: evacuationRequired,

          // PostGIS POINT
          //
          // IMPORTANT:
          // PostGIS uses:
          // POINT(longitude latitude)
          //
          location: `POINT(${longitude} ${latitude})`,

          address: address || null,
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      // ----------------------------------------------
      // Success
      // ----------------------------------------------

      setSuccess(true);

      setTimeout(() => {
        router.push("/dashboard?reported=true");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      console.error("Emergency report error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to submit emergency report.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">

        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-red-950/40 via-white/[0.03] to-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">

          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-red-600/10 blur-3xl" />

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-600/20 text-red-500">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-red-500">
              RESQAI Citizen Channel
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Emergency Dispatch Report
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Submit incident details for automated AI classification,
            priority scoring, and PostGIS resource allocation.
          </p>
        </div>

        {/* Success */}
        {success ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center backdrop-blur-xl">

            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 animate-bounce text-emerald-400" />

            <h2 className="text-2xl font-bold text-white">
              Report Successfully Broadcasted
            </h2>

            <p className="mt-2 text-sm text-zinc-300">
              Your emergency has been registered into the queue.
              Redirecting to live command dashboard...
            </p>
          </div>
        ) : (

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl md:p-8"
          >

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
                {error}
              </div>
            )}

            {/* Incident Title */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Incident Summary Title *
              </label>

              <input
                type="text"
                required
                placeholder="e.g., Severe Water Logging & Trapped Residents"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Incident Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Emergency Category
              </label>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                {[
                  {
                    id: "MEDICAL",
                    label: "Medical",
                    icon: HeartPulse,
                  },
                  {
                    id: "FIRE",
                    label: "Fire Hazard",
                    icon: Flame,
                  },
                  {
                    id: "FLOOD",
                    label: "Flood / Water",
                    icon: Waves,
                  },
                  {
                    id: "ROAD_ACCIDENT",
                    label: "Accident",
                    icon: Car,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = incidentType === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIncidentType(item.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition ${
                        isSelected
                          ? "border-red-500 bg-red-600/20 text-white shadow-lg shadow-red-600/20"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isSelected
                            ? "text-red-400"
                            : "text-zinc-400"
                        }`}
                      />

                      {item.label}
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Detailed Description
              </label>

              <textarea
                required
                rows={4}
                placeholder="Provide accurate details about the emergency situation, specific landmarks, or trapped individuals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* GPS */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Emergency Location
                  </span>

                  <p className="mt-1 font-mono text-sm text-zinc-300">
                    {address || "Coordinates not acquired yet"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={fetchingLocation}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fetchingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 text-red-500" />
                  )}

                  {fetchingLocation
                    ? "Getting Location..."
                    : "Capture Current GPS"}
                </button>

              </div>

              {/* Captured location */}
              {latitude !== null && longitude !== null && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">

                  <p className="text-xs font-semibold text-emerald-400">
                    ✓ GPS location captured
                  </p>

                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    Latitude: {latitude.toFixed(6)}
                    <br />
                    Longitude: {longitude.toFixed(6)}
                  </p>

                </div>
              )}

            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* People */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  People Affected
                </label>

                <input
                  type="number"
                  min={1}
                  value={affectedCount}
                  onChange={(e) =>
                    setAffectedCount(Number(e.target.value))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Medical */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">

                <span className="text-xs font-semibold text-zinc-300">
                  Medical Assistance
                </span>

                <input
                  type="checkbox"
                  checked={medicalRequired}
                  onChange={(e) =>
                    setMedicalRequired(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black text-red-600 focus:ring-red-500"
                />

              </div>

              {/* Evacuation */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">

                <span className="text-xs font-semibold text-zinc-300">
                  Evacuation Required
                </span>

                <input
                  type="checkbox"
                  checked={evacuationRequired}
                  onChange={(e) =>
                    setEvacuationRequired(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/20 bg-black text-red-600 focus:ring-red-500"
                />

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || fetchingLocation}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Broadcasting Emergency...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5" />
                  Submit Emergency Report
                </>
              )}

            </button>

          </form>
        )}

      </div>
    </main>
  );
}


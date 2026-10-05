"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  MapPin, 
  AlertTriangle, 
  Flame, 
  Waves, 
  HeartPulse, 
  Car, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2,
  Upload
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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  // Get current GPS location using browser API
  const handleGetLocation = () => {
    setFetchingLocation(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        setFetchingLocation(false);
      },
      (err) => {
        setError(`Unable to retrieve your location: ${err.message}`);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Insert into incidents table 
      // Note: PostGIS point geometry can be formatted as `POINT(longitude latitude)` if using PostGIS functions, 
      // or stored via latitude/longitude columns depending on your schema.
      const { error: insertError } = await supabase.from("incidents").insert({
        user_id: user.id,
        title,
        description,
        incident_type: incidentType,
        severity: "HIGH", // Default initial severity before AI classification module overrides it
        status: "PENDING",
        affected_count: Number(affectedCount),
        medical_required: medicalRequired,
        evacuation_required: evacuationRequired,
        latitude: latitude || 28.6139, // Fallback default coordinates if not captured
        longitude: longitude || 77.2090,
        address: address || "Manual submission point",
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to submit emergency report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        
        {/* Navigation back */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Command Dashboard
          </Link>
        </div>

        {/* Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-red-950/40 via-white/[0.03] to-white/[0.02] p-8 shadow-2xl backdrop-blur-xl mb-8">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/30 text-red-500">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-wider text-red-500 uppercase">RESQAI Citizen Channel</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Emergency Dispatch Report
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Submit incident details for automated AI classification, priority scoring, and PostGIS resource allocation[cite: 4].
          </p>
        </div>

        {success ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center backdrop-blur-xl">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">Report Successfully Broadcasted</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Your emergency has been registered into the queue. Redirecting to live command dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8 backdrop-blur-xl">
            
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
                {error}
              </div>
            )}

            {/* Incident Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
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

            {/* Incident Type Grid */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Emergency Category[cite: 4]
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "MEDICAL", label: "Medical", icon: HeartPulse },
                  { id: "FIRE", label: "Fire Hazard", icon: Flame },
                  { id: "FLOOD", label: "Flood / Water", icon: Waves },
                  { id: "ROAD_ACCIDENT", label: "Accident", icon: Car },
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
                      <Icon className={`h-5 w-5 ${isSelected ? "text-red-400" : "text-zinc-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Detailed Description[cite: 4]
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

            {/* Geolocation Section */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Spatial Coordinates (PostGIS)</span>
                  <p className="text-sm font-mono text-zinc-300 mt-1">
                    {address || "Coordinates not acquired yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={fetchingLocation}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95"
                >
                  {fetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 text-red-500" />}
                  Capture Current GPS
                </button>
              </div>
            </div>

            {/* Metrics & Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  People Affected[cite: 4]
                </label>
                <input
                  type="number"
                  min={1}
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Number(e.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-xs font-semibold text-zinc-300">Medical Assistance Required[cite: 4]</span>
                <input
                  type="checkbox"
                  checked={medicalRequired}
                  onChange={(e) => setMedicalRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black text-red-600 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-xs font-semibold text-zinc-300">Evacuation Required[cite: 4]</span>
                <input
                  type="checkbox"
                  checked={evacuationRequired}
                  onChange={(e) => setEvacuationRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black text-red-600 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-95 disabled:opacity-50"
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
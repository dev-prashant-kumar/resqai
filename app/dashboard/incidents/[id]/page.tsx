import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  ShieldAlert,
  Activity,
} from "lucide-react";
import IncidentStatusActions from "@/components/IncidentStatusActions";

export const dynamic = "force-dynamic";

export default async function IncidentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toUpperCase() || "CITIZEN";

  // Fetch incident details from Supabase

const { data: incident, error } = await supabase
  .from("incidents")
  .select(
    "id,reported_by,title,description,incident_type,severity,status,address,affected_people,medical_required,evacuation_required,created_at,ai_confidence,ai_analysis"
  )
  .eq("id", id)
  .single();

// Handle missing incidents or Supabase query errors first.
if (error || !incident) {
  console.error("Supabase Incident Fetch Error:", error);
  notFound();
}

const isAdminOrOperator = role === "ADMIN" || role === "OPERATOR";
const isOwner = incident.reported_by === user.id;
const isClosed = ["RESOLVED", "CANCELLED"].includes(incident.status);


  return (
    <main className="min-h-screen bg-[#08090c] px-4 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              {isOwner ? "Your Reported Emergency" : "Incident Tracking Review"}
            </p>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              {incident.title || "Emergency Incident"}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 font-mono">
              ID: {incident.id}
            </p>
          </div>

          <span className="w-fit rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300">
            {incident.severity || "MEDIUM"}
          </span>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-white/[0.08] bg-[#101115] p-5 sm:p-6">
              <h2 className="font-bold text-white">Incident Information</h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {incident.description || "No description provided."}
              </p>

              <div className="mt-6 grid gap-4 border-t border-white/[0.07] pt-5 sm:grid-cols-2">
                <Info
                  icon={<Activity size={17} />}
                  label="Incident type"
                  value={incident.incident_type?.replaceAll("_", " ") || "GENERAL"}
                />
                <Info
                  icon={<Clock size={17} />}
                  label="Reported at"
                  value={
                    incident.created_at
                      ? new Date(incident.created_at).toLocaleString()
                      : "Unavailable"
                  }
                />
                <Info
                  icon={<MapPin size={17} />}
                  label="Address"
                  value={incident.address || "Coordinates logged via PostGIS point"}
                />
                <Info
                  icon={<Users size={17} />}
                  label="People affected"
                  value={String(incident.affected_people ?? "Not specified")}
                />
              </div>
            </div>

            {/* AI Analysis Card */}
            {incident.ai_analysis && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#101115] p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold text-white">
                  <ShieldAlert size={18} className="text-red-400" />
                  AI Classification & Intelligence
                </h2>
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                    {typeof incident.ai_analysis === "string"
                      ? incident.ai_analysis
                      : JSON.stringify(incident.ai_analysis, null, 2)}
                  </p>
                  {incident.ai_confidence != null && (
                    <p className="mt-3 text-xs text-zinc-500 font-mono">
                      Confidence Score:{" "}
                      {Number(incident.ai_confidence) <= 1
                        ? `${(Number(incident.ai_confidence) * 100).toFixed(1)}%`
                        : `${Number(incident.ai_confidence).toFixed(1)}%`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Sidebar: Conditional Controls vs Status Tracker */}
          <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101115] p-5 sm:p-6">
            <h2 className="font-bold text-white">Response Status</h2>
            <p className="mt-2 text-xs text-zinc-500">
              {isAdminOrOperator
                ? "Manage emergency status and trigger dispatch matrix updates."
                : "Live dispatch lifecycle tracking for this report."}
            </p>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/30 p-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Current Status</p>
              <p className="mt-1 text-sm font-black text-red-400">
                {incident.status?.replaceAll("_", " ") || "REPORTED"}
              </p>
            </div>

            {isAdminOrOperator ? (
              !isClosed ? (
                <IncidentStatusActions incidentId={incident.id} currentStatus={incident.status} />
              ) : (
                <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-emerald-300">
                  Incident is CLOSED (Resolved or Cancelled).
                </p>
              )
            ) : (
              <p className="mt-5 text-xs leading-5 text-zinc-400 border-t border-white/5 pt-4">
                Your report is registered with the ResQAI command center. Responders receive real-time location and priority updates automatically.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-red-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  );
}
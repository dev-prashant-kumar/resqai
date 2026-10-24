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
import ResourceAssignmentBox from "@/components/ResourceAssignmentBox";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function IncidentDetailsPage({ params }: PageProps) {
  // Properly handle params whether it's a Promise or a direct object
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) {
    notFound();
  }

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

  // Fetch incident details along with joined auto-dispatched resource data in one query
  const { data: incident, error } = await supabase
    .from("incidents")
    .select(
      `
      *,
      resources (
        id,
        name,
        resource_type,
        status
      )
    `
    )
    .eq("id", id)
    .single();

  // Handle missing incidents or Supabase query errors first.
  if (error || !incident) {
    console.error("Supabase Incident Fetch Error:", error);
    notFound();
  }

  const isAuthorizedResponderOrAdmin =
    role === "ADMIN" || role === "OPERATOR" || role === "RESPONDER";
  const isOwner = incident.reported_by === user.id;
  const isClosed = ["RESOLVED", "CANCELLED"].includes(
    String(incident.status ?? "").toUpperCase()
  );

  const backUrl =
    role === "RESPONDER"
      ? "/responder"
      : role === "ADMIN"
      ? "/incidents"
      : "/dashboard";

  // Fetch available resources & assigned resources concurrently
  const [availableResResult, assignedResResult] = await Promise.all([
    supabase
      .from("resources")
      .select("id, name, resource_type, status")
      .eq("status", "AVAILABLE"),
    supabase
      .from("resources")
      .select("id, name, resource_type, status")
      .eq("assigned_incident_id", id),
  ]);

  const availableResources = availableResResult.data ?? [];
  const assignedResources = assignedResResult.data ?? [];

  return (
    <main className="min-h-screen bg-[#060709] px-4 py-8 text-zinc-100 sm:px-8 flex flex-col justify-between antialiased selection:bg-red-500 selection:text-white">
      <div className="mx-auto max-w-5xl w-full">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={16} /> Back to{" "}
          {role === "RESPONDER" ? "Response Center" : "Dashboard"}
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              {isOwner ? "Your Reported Emergency" : "Incident Tracking Review"}
            </p>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl text-white">
              {incident.title || "Emergency Incident"}
            </h1>
            <p className="mt-2 text-xs text-zinc-500 font-mono">
              ID: {incident.id}
            </p>
          </div>

          <span className="w-fit rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 uppercase tracking-wider">
            {incident.severity || "MEDIUM"}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          {/* Left Column: Details + AI Intelligence + Auto-Dispatch Status + Resource Assignment Box */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl">
              <h2 className="font-bold text-white text-base">
                Incident Information
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {incident.description || "No description provided."}
              </p>

              <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                <Info
                  icon={<Activity size={17} />}
                  label="Incident type"
                  value={
                    incident.incident_type?.replaceAll("_", " ") || "GENERAL"
                  }
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
                  value={
                    incident.address || "Coordinates logged via PostGIS point"
                  }
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
              <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl">
                <h2 className="flex items-center gap-2 font-bold text-white text-base">
                  <ShieldAlert size={18} className="text-red-400" />
                  AI Classification & Intelligence
                </h2>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                    {typeof incident.ai_analysis === "string"
                      ? incident.ai_analysis
                      : JSON.stringify(incident.ai_analysis, null, 2)}
                  </p>
                  {incident.ai_confidence != null && (
                    <p className="mt-3 text-xs text-zinc-500 font-mono">
                      Confidence Score:{" "}
                      {Number(incident.ai_confidence) <= 1
                        ? `${(Number(incident.ai_confidence) * 100).toFixed(
                            1
                          )}%`
                        : `${Number(incident.ai_confidence).toFixed(1)}%`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Live Auto-Dispatched Unit Card (Visible to both Users & Responders) */}
            {(() => {
              // Handle if resources comes back as an array or a single object from Supabase join
              const assignedRes = Array.isArray(incident?.resources)
                ? incident.resources[0]
                : incident?.resources;

              return assignedRes ? (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-lg">
                      🚑
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Unit Dispatched & En Route
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {assignedRes.name} ({assignedRes.resource_type})
                      </h4>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
                    Your emergency has been matched automatically with the
                    nearest available unit. Help is on the way.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 animate-pulse text-lg">
                      🔍
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Dispatch in Progress
                      </span>
                      <h4 className="text-base font-bold text-white">
                        Searching Nearest Unit
                      </h4>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                    Scanning sector coordinates for the closest available
                    emergency responder...
                  </p>
                </div>
              );
            })()}

            {/* Manual Resource Assignment Box (For Responders/Admins) */}
            {isAuthorizedResponderOrAdmin && !isClosed && (
              <ResourceAssignmentBox
                incidentId={incident.id}
                incidentType={incident.incident_type}
                medicalRequired={incident.medical_required}
                evacuationRequired={incident.evacuation_required}
                availableResources={availableResources}
                assignedResources={assignedResources}
              />
            )}
          </section>

          {/* Right Sidebar: Response Status & State Machine Actions */}
          <aside className="h-fit space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 sm:p-6 shadow-xl">
              <h2 className="font-bold text-white text-base">
                Response Status
              </h2>
              <p className="mt-1.5 text-xs text-zinc-400">
                {isAuthorizedResponderOrAdmin
                  ? "Manage emergency status and trigger progress updates."
                  : "Live dispatch lifecycle tracking for this report."}
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                  Current Status
                </p>
                <p className="mt-1 text-sm font-black text-red-400 uppercase tracking-wide">
                  {incident.status?.replaceAll("_", " ") || "REPORTED"}
                </p>
              </div>

              {/* Render status-machine progress actions on the right */}
              {isAuthorizedResponderOrAdmin ? (
                !isClosed ? (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <IncidentStatusActions
                      incidentId={incident.id}
                      currentStatus={incident.status}
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300">
                    Incident is CLOSED (Resolved or Cancelled). Operations
                    finalized.
                  </div>
                )
              ) : (
                <p className="mt-5 text-xs leading-5 text-zinc-400 border-t border-white/10 pt-4">
                  Your report is registered with the ResQAI command center.
                  Responders receive real-time location and priority updates
                  automatically.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <footer className="hidden md:flex border-t border-white/10 bg-[#060709] py-6 px-8 items-center justify-between text-xs text-zinc-500 mt-16 w-full">
        <div>© {new Date().getFullYear()} ResQAI. All rights reserved.</div>
        <div>
          Developed by{" "}
          <a
            href="https://github.com/dev-prashant-kumar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 font-semibold underline underline-offset-4 transition hover:text-red-300"
          >
            Shant
          </a>
        </div>
      </footer>
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-red-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

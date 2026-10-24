import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileWarning,
  HeartPulse,
  Car
} from "lucide-react";

type Incident = {
  id: string;
  title: string;
  description: string | null;
  incident_type: string;
  severity: string;
  status: string;
  address: string | null;
  created_at: string;
  affected_people: number | null;
};

const statusStyles: Record<string, string> = {
  REPORTED: "bg-blue-50 text-blue-700",
  ANALYZING: "bg-violet-50 text-violet-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  ASSIGNED: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const severityStyles: Record<string, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export default async function CitizenDashboard() {
  const supabase = await createClient();

  // 1. Verify the authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Check whether this user owns a registered government organization.
  //
  // Organization registration currently creates a row in
  // responder_organizations, while the profile role may remain CITIZEN.
  // Therefore, check organization ownership before loading the profile role.
  //
  // This check only changes dashboard routing. It does not grant operational
  // responder permissions or approve the organization's application.
  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from("responder_organizations")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  // Redirect organization owners to their organization dashboard.
  // The responder dashboard is responsible for showing the verification
  // status and restricting unapproved organizations from operational actions.
  if (!organizationError && organization) {
    redirect("/responder");
  }

  // 3. Load the authenticated user's profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg">
          <ShieldCheck className="mx-auto mb-4 text-blue-600" size={42} />

          <h1 className="text-xl font-bold text-slate-900">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            We couldn't load your account profile. Please sign in again or
            contact support if the problem continues.
          </p>

          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Return to login
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 4. Preserve routing for other authorized account roles.
  if (profile.role === "RESPONDER") {
    redirect("/responder");
  }

  if (profile.role === "OPERATOR") {
    redirect("/operator");
  }

  if (profile.role === "ADMIN") {
    redirect("/admin");
  }

  // Only citizen accounts should continue to the citizen dashboard.
  if (profile.role !== "CITIZEN") {
    redirect("/login");
  }

  // 5. Fetch only the incidents reported by this citizen.
  const { data: incidentData, error: incidentsError } = await supabase
    .from("incidents")
    .select(
      "id, title, description, incident_type, severity, status, address, created_at, affected_people"
    )
    .eq("reported_by", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const incidents = (incidentData ?? []) as Incident[];

  const activeStatuses = [
    "REPORTED",
    "ANALYZING",
    "VERIFIED",
    "ASSIGNED",
    "IN_PROGRESS",
  ];

  const activeCount = incidents.filter((incident) =>
    activeStatuses.includes(incident.status)
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500 selection:text-white overflow-x-hidden flex flex-col justify-between">
      <div>
        {/* Top Command Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-zinc-950/85 px-4 sm:px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-inner">
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-red-500 uppercase block">RESQAI Command</span>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">AI Emergency Platform</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              PostGIS & Realtime Active
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

        {/* Main Container */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-8">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-red-950/30 via-white/[0.03] to-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-6 sm:mb-8">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-bold text-red-400">
                    CLEARANCE: {role}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-mono truncate max-w-[200px] sm:max-w-none">
                    {user.email}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                  Terminal: {profile?.full_name || "Operator"}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  {isOperatorOrResponder 
                    ? "Monitoring spatial incident streams, automated severity assessment queues, and optimal resource allocation engines."
                    : "Submit structured emergency reports with NLP classification, GPS coordinates, and real-time response tracking."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {role === "CITIZEN" ? (
                  <Link href="/report" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-95">
                      <PlusCircle className="h-5 w-5" />
                      Report New Emergency
                    </button>
                  </Link>
                ) : (
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 border border-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700">
                    <Radio className="h-5 w-5 text-red-400 animate-pulse" />
                    Dispatch Override Matrix
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-3xl font-extrabold">{incidents.length}</p>

            <p className="mt-1 text-xs text-slate-400">
              Latest reports displayed below
            </p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 mb-6 sm:mb-8">
            
            {/* Metric 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Incidents</span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalIncidents || 0}</div>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 truncate">PostGIS database</p>
            </div>

            {/* Metric 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">Critical Hazards</span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{criticalIncidents || 0}</div>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 truncate">Immediate priority</p>
            </div>

            {/* Metric 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">Available Units</span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{availableResources || 0}</div>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 truncate">Teams & vehicles</p>
            </div>

            {/* Metric 4 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Shelters</span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{activeShelters || 0}</div>
              <p className="mt-1 text-[10px] sm:text-xs text-zinc-500 truncate">Centers online</p>
            </div>

          </div>

          {/* Operational Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Left Column: Real-time Incident Feed */}
            <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500 shrink-0" />
                    <span>Live Incident Stream & AI Classification</span>
                  </h3>
                  <span className="self-start sm:self-auto text-[10px] sm:text-[11px] text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full whitespace-nowrap">
                    Supabase Realtime
                  </span>
                </div>

                {recentIncidents && recentIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {recentIncidents.map((incident) => (
                      <div 
                        key={incident.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                            {incident.incident_type === "FIRE" ? <Flame className="h-5 w-5" /> :
                             incident.incident_type === "FLOOD" ? <Waves className="h-5 w-5" /> :
                             incident.incident_type === "MEDICAL" ? <HeartPulse className="h-5 w-5" /> :
                             incident.incident_type === "ROAD_ACCIDENT" ? <Car className="h-5 w-5" /> :
                             <AlertTriangle className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{incident.title}</h4>
                            <p className="text-xs text-zinc-400 truncate">{incident.address || "Coordinates logged via PostGIS point"}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                            incident.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            incident.severity === "HIGH" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                            "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {incident.severity}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 sm:p-12 text-center">
                    <Radio className="h-10 w-10 text-zinc-600 animate-pulse mb-3" />
                    <p className="text-sm font-medium text-zinc-300">No active emergency reports in the queue.</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">Submitted incidents will appear here instantly through real-time subscriptions.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 text-center sm:text-left">
                <span>Optimization Engine: Active</span>
                <span>FastAPI NLP & Severity Scorer Ready</span>
              </div>
            </div>

            {/* Right Column: User Profile & System Status */}
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  Active Node Operator
                </h3>
                
                <div className="space-y-3 sm:space-y-4 text-sm">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Full Name</span>
                    <span className="font-semibold text-zinc-200 truncate block">{profile?.full_name || "Emergency Responder"}</span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</span>
                    <span className="font-semibold text-zinc-200 font-mono text-xs truncate block">{user.email}</span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Contact Phone</span>
                    <span className="font-semibold text-zinc-200">{profile?.phone || "Not configured"}</span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System Role</span>
                    <span className="inline-block mt-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-bold text-red-400">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <span className="text-[10px] sm:text-[11px] text-zinc-500 tracking-wider uppercase font-medium">
                  RESQAI Platform Architecture v2.4
                </span>
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                Need urgent help?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                If someone is in immediate danger, contact the appropriate
                local emergency service. Do not wait for an online report to
                be reviewed.
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-700">
                <Users size={16} />
                Emergency reports require human review.
              </div>
            </section>
          </aside>
        </div>

        <footer className="py-8 text-center text-xs text-slate-400">
          ResQAI · Emergency information and community safety
        </footer>
      </div>

      {/* Dashboard Footer Credit */}
      <footer className="border-t border-white/10 bg-zinc-950/60 py-6 px-4 sm:px-8 text-center sm:flex sm:items-center sm:justify-between text-xs text-zinc-500">
        <div>© {new Date().getFullYear()} ResQAI. All rights reserved.</div>
        <div className="mt-2 sm:mt-0">
          Developed by{" "}
          <a
            href="https://github.com/dev-prashant-kumar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400  transition hover:text-red-300"
          >
            Shant
          </a>
        </div>
      </footer>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  MapPin, 
  LogOut, 
  Activity,
  PlusCircle,
  Truck,
  Users,
  Flame,
  Waves,
  HeartPulse,
  Car
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile data including role and full name[cite: 2]
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .single();

  // Fetch real-time metrics for the command dashboard[cite: 6]
  const { count: totalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true });

  const { count: criticalIncidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("severity", "CRITICAL");

  const { count: availableResources } = await supabase
    .from("resources")
    .select("*", { count: "exact", head: true })
    .eq("status", "AVAILABLE");

  const { count: activeShelters } = await supabase
    .from("shelters")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Fetch recent incidents for the command feed[cite: 4, 6]
  const { data: recentIncidents } = await supabase
    .from("incidents")
    .select("id, title, incident_type, severity, status, created_at, address")
    .order("created_at", { ascending: false })
    .limit(5);

  // Server action for logging out securely
  async function signOut() {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/login");
  }

  const role = profile?.role || "CITIZEN";
  const isOperatorOrResponder = role === "OPERATOR" || role === "ADMIN" || role === "RESPONDER";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500 selection:text-white">
      {/* Top Command Navbar[cite: 6] */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-zinc-950/80 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/30 text-red-500 shadow-inner">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">RESQAI Command Center</span>
            <h2 className="text-sm font-bold text-white">AI Emergency & Resource Platform</h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            PostGIS & Realtime Active
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        
        {/* Welcome Banner matching Synopsis role separation[cite: 2] */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-red-950/30 via-white/[0.03] to-white/[0.02] p-8 shadow-2xl backdrop-blur-xl mb-8">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-red-500/20 border border-red-500/30 px-3 py-0.5 text-xs font-bold text-red-400">
                  SECURITY CLEARANCE: {role}
                </span>
                <span className="text-xs text-zinc-400 font-mono">NODE: {user.email}</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Command Terminal: {profile?.full_name || "Operator"}
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
                {isOperatorOrResponder 
                  ? "Monitoring spatial incident streams, automated severity assessment queues, and optimal resource allocation engines[cite: 4, 5]."
                  : "Submit structured emergency reports with NLP classification, GPS coordinates, and real-time response tracking[cite: 2, 4]."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {role === "CITIZEN" ? (
                <Link href="/report">
                <button className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 active:scale-95">
                  <PlusCircle className="h-5 w-5" />
                  Report New Emergency
                </button>
                </Link>
              ) : (
                <button className="flex items-center gap-2 rounded-2xl bg-zinc-800 border border-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-700">
                  <Radio className="h-5 w-5 text-red-400 animate-pulse" />
                  Dispatch Override Matrix
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Core Metrics Grid[cite: 6, 10] */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-8">
          
          {/* Metric 1 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Incidents</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{totalIncidents || 0}</div>
            <p className="mt-1 text-xs text-zinc-500">Logged in PostGIS database</p>
          </div>

          {/* Metric 2 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Critical Hazards</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{criticalIncidents || 0}</div>
            <p className="mt-1 text-xs text-zinc-500">Requiring immediate priority</p>
          </div>

          {/* Metric 3 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Available Units</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{availableResources || 0}</div>
            <p className="mt-1 text-xs text-zinc-500">Ambulances, teams & vehicles</p>
          </div>

          {/* Metric 4 */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Shelters</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{activeShelters || 0}</div>
            <p className="mt-1 text-xs text-zinc-500">Evacuation centers online</p>
          </div>

        </div>

        {/* Operational Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Real-time Incident Feed & AI Classification Overview[cite: 4, 6] */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  Live Incident Stream & AI Classification
                </h3>
                <span className="text-[11px] text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  Supabase Realtime Feed
                </span>
              </div>

              {recentIncidents && recentIncidents.length > 0 ? (
                <div className="space-y-3">
                  {recentIncidents.map((incident) => (
                    <div 
                      key={incident.id} 
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                          {incident.incident_type === "FIRE" ? <Flame className="h-5 w-5" /> :
                           incident.incident_type === "FLOOD" ? <Waves className="h-5 w-5" /> :
                           incident.incident_type === "MEDICAL" ? <HeartPulse className="h-5 w-5" /> :
                           incident.incident_type === "ROAD_ACCIDENT" ? <Car className="h-5 w-5" /> :
                           <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{incident.title}</h4>
                          <p className="text-xs text-zinc-400">{incident.address || "Coordinates logged via PostGIS point"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-12 text-center">
                  <Radio className="h-10 w-10 text-zinc-600 animate-pulse mb-3" />
                  <p className="text-sm font-medium text-zinc-300">No active emergency reports in the queue.</p>
                  <p className="text-xs text-zinc-500 mt-1">Submitted incidents will appear here instantly through real-time subscriptions.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
              <span>Optimization Engine: Active</span>
              <span>FastAPI NLP & Severity Scorer Ready</span>
            </div>
          </div>

          {/* Right Column: User Profile & System Status */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                Active Node Operator
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Full Name</span>
                  <span className="font-semibold text-zinc-200">{profile?.full_name || "Emergency Responder"}</span>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-zinc-200 font-mono text-xs">{user.email}</span>
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
              <span className="text-[11px] text-zinc-500 tracking-wider uppercase font-medium">
                RESQAI Platform Architecture v2.4
              </span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}